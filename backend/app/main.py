import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import SIMULATED_MODE, SERIAL_PORT, BAUD_RATE
from app.services.telemetry_service import TelemetryService
from app.utils.parser import parse_serial_line
from app.serial_reader.lora_serial import LoRaSerialReader
from app.websocket.socket_manager import SocketManager
from app.routes.telemetry_routes import router as telemetry_router

telemetry_service = TelemetryService()
socket_manager = SocketManager()
serial_reader = LoRaSerialReader(
    port=SERIAL_PORT,
    baudrate=BAUD_RATE,
    simulated=SIMULATED_MODE,
)


def on_serial_data(line: str):
    packet = parse_serial_line(line)
    if packet is None:
        return
    telemetry_service.add_packet(packet)

    state = telemetry_service.get_system_state()
    message = {
        "type": "telemetry",
        "packet": packet.model_dump(),
        "system": state,
    }
    asyncio.run_coroutine_threadsafe(
        socket_manager.broadcast(message), _event_loop
    )


def on_heartbeat(line: str):
    try:
        data = json.loads(line)
    except json.JSONDecodeError:
        return
    telemetry_service._rx_online = True
    if "packets_rx" in data:
        telemetry_service.packets_received = int(data["packets_rx"])
    asyncio.run_coroutine_threadsafe(
        socket_manager.broadcast({"type": "heartbeat", "data": data}), _event_loop
    )


def on_serial_status(event_type: str, data: dict):
    print(f"[SERIAL] Status: {event_type} -> {data}")
    if _event_loop:
        asyncio.run_coroutine_threadsafe(
            socket_manager.broadcast({
                "type": "serial_status",
                "event": event_type,
                "data": data,
            }),
            _event_loop,
        )


_event_loop: asyncio.AbstractEventLoop = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _event_loop
    _event_loop = asyncio.get_running_loop()

    serial_reader.set_data_callback(on_serial_data)
    serial_reader.set_heartbeat_callback(on_heartbeat)
    serial_reader.set_status_callback(on_serial_status)
    serial_reader.start()
    print(f"[SERIAL] Modo: {'SIMULADO' if SIMULATED_MODE else 'REAL'} | Puerto: {SERIAL_PORT}")
    yield
    serial_reader.stop()
    print("[SERIAL] Detenido")


app = FastAPI(
    title="LoRa Radioenlace Monitor",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telemetry_router)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await socket_manager.connect(websocket)
    state = telemetry_service.get_system_state()
    await socket_manager.send_state(websocket, state)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await socket_manager.disconnect(websocket)
    except Exception:
        await socket_manager.disconnect(websocket)


@app.get("/")
async def root():
    return {
        "service": "LoRa Radioenlace Monitor API",
        "version": "1.0.0",
        "simulated": SIMULATED_MODE,
        "ws_connections": socket_manager.active_connections,
    }
