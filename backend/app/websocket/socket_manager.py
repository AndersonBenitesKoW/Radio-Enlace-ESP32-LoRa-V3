import json
from fastapi import WebSocket
from typing import Set


class SocketManager:
    def __init__(self):
        self._connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self._connections.add(websocket)

    async def disconnect(self, websocket: WebSocket):
        self._connections.discard(websocket)

    async def broadcast(self, message: dict):
        payload = json.dumps(message)
        dead = set()
        for ws in self._connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.add(ws)
        self._connections -= dead

    async def send_state(self, websocket: WebSocket, state: dict):
        try:
            await websocket.send_json({"type": "init", "data": state})
        except Exception:
            pass

    @property
    def active_connections(self) -> int:
        return len(self._connections)
