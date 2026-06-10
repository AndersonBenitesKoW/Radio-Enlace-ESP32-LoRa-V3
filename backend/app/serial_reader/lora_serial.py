import random
import time
import json
import threading
from datetime import datetime

try:
    import serial
    HAS_PYSERIAL = True
except ImportError:
    HAS_PYSERIAL = False


class LoRaSerialReader:
    def __init__(self, port: str = "COM3", baudrate: int = 115200, simulated: bool = False):
        self.port = port
        self.baudrate = baudrate
        self.simulated = simulated
        self._running = False
        self._thread = None
        self._on_data_callback = None
        self._on_heartbeat_callback = None
        self._on_status_callback = None
        self._sim_packet_id = 0
        self._connected = False

    def set_data_callback(self, callback):
        self._on_data_callback = callback

    def set_heartbeat_callback(self, callback):
        self._on_heartbeat_callback = callback

    def set_status_callback(self, callback):
        self._on_status_callback = callback

    @property
    def connected(self) -> bool:
        return self._connected

    def start(self):
        self._running = True
        self._thread = threading.Thread(target=self._read_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)

    def _read_loop(self):
        if self.simulated:
            self._connected = True
            if self._on_status_callback:
                self._on_status_callback("serial_connected", {"port": self.port, "simulated": True})
            self._simulated_loop()
            return
        for attempt in range(1, 6):
            if not self._running:
                return
            print(f"[SERIAL] Intento {attempt}/5 de abrir {self.port}...")
            if self._try_open_serial():
                return
            print(f"[SERIAL] No se pudo abrir {self.port}. ¿Cerraste el Serial Monitor del Arduino IDE?")
            if attempt < 5:
                print(f"[SERIAL] Reintentando en 3 segundos...")
                time.sleep(3)
        print("[SERIAL] AGOTADOS los reintentos. NO hay datos reales. Abortando lector serial.")
        print("[SERIAL] Asegurate de cerrar Arduino IDE / Serial Monitor y reinicia el backend.")
        self._connected = False
        if self._on_status_callback:
            self._on_status_callback("serial_error", {
                "port": self.port,
                "message": f"No se pudo abrir {self.port} tras 5 intentos. ¿Serial Monitor abierto?"
            })

    def _try_open_serial(self) -> bool:
        if not HAS_PYSERIAL:
            self._connected = False
            if self._on_status_callback:
                self._on_status_callback("serial_error", {
                    "port": self.port,
                    "message": "pyserial no esta instalado. Instala con: pip install pyserial"
                })
            return False
        try:
            ser = serial.Serial(self.port, self.baudrate, timeout=1)
            self._connected = True
            if self._on_status_callback:
                self._on_status_callback("serial_connected", {"port": self.port, "simulated": False})
            print(f"[SERIAL] Conexion establecida con {self.port}")
            while self._running:
                try:
                    line = ser.readline().decode("utf-8", errors="ignore").strip()
                    if line:
                        self._process_line(line)
                except serial.SerialException:
                    break
                except UnicodeDecodeError:
                    continue
            ser.close()
            self._connected = False
            if self._on_status_callback:
                self._on_status_callback("serial_disconnected", {"port": self.port})
            return True
        except (serial.SerialException, OSError) as e:
            self._connected = False
            if self._on_status_callback:
                self._on_status_callback("serial_error", {
                    "port": self.port,
                    "message": f"Error abriendo {self.port}: {str(e)}"
                })
            return False

    def _simulated_loop(self):
        while self._running:
            self._sim_packet_id += 1

            rssi = random.gauss(-75, 12)
            snr = random.gauss(8.5, 3)
            latency = random.uniform(5, 45)
            freq_err = random.gauss(0, 500)
            raw = "simulated_lora_packet"

            line = json.dumps({
                "type": "telemetry",
                "rssi": round(rssi, 1),
                "snr": round(snr, 1),
                "latency_ms": round(latency, 1),
                "packet_id": self._sim_packet_id,
                "frequency_error": round(freq_err, 1),
                "data": raw,
            })

            self._process_line(line)

            if self._sim_packet_id % 5 == 0 and self._on_heartbeat_callback:
                heartbeat = json.dumps({
                    "type": "heartbeat",
                    "status": "online",
                    "uptime": int(time.time()),
                })
                self._on_heartbeat_callback(heartbeat)

            time.sleep(1.0)

    def _process_line(self, line: str):
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            return

        if data.get("type") == "telemetry" and self._on_data_callback:
            self._on_data_callback(line)
        elif data.get("type") == "heartbeat" and self._on_heartbeat_callback:
            self._on_heartbeat_callback(line)
