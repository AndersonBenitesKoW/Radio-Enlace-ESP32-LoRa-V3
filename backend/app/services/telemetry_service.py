from collections import deque
from datetime import datetime
from typing import Optional
from app.models.telemetry_model import TelemetryPacket

BUFFER_SIZE = 1000


class TelemetryService:
    def __init__(self):
        self.buffer: deque[TelemetryPacket] = deque(maxlen=BUFFER_SIZE)
        self.latest: Optional[TelemetryPacket] = None
        self.packets_sent: int = 0
        self.packets_received: int = 0
        self.packets_lost: int = 0
        self.start_time = datetime.now()
        self._last_packet_id: Optional[int] = None
        self._tx_online: bool = True
        self._rx_online: bool = True

    def add_packet(self, packet: TelemetryPacket):
        self.buffer.append(packet)
        self.latest = packet
        self.packets_received += 1

        if self._last_packet_id is not None:
            expected = self._last_packet_id + 1
            gap = packet.packet_id - expected
            if gap > 0:
                self.packets_lost += gap

        self._last_packet_id = packet.packet_id
        self.packets_sent = packet.packet_id
        self._rx_online = True
        self._tx_online = True

    def get_history(self, limit: int = 100) -> list[TelemetryPacket]:
        items = list(self.buffer)
        return items[-limit:]

    def get_latest(self) -> Optional[TelemetryPacket]:
        return self.latest

    @property
    def packet_loss_pct(self) -> float:
        if self.packets_sent == 0:
            return 0.0
        return round((self.packets_lost / max(self.packets_sent, self.packets_received)) * 100, 1)

    @property
    def uptime_seconds(self) -> int:
        return int((datetime.now() - self.start_time).total_seconds())

    @property
    def link_state(self) -> str:
        if self.latest is None:
            return "SIN_DATOS"
        rssi = self.latest.rssi
        if rssi >= -60:
            return "EXCELENTE"
        if rssi >= -80:
            return "BUENA"
        if rssi >= -100:
            return "REGULAR"
        if rssi >= -115:
            return "MARGINAL"
        return "CRITICA"

    def get_system_state(self) -> dict:
        return {
            "tx_online": self._tx_online,
            "rx_online": self._rx_online,
            "packets_sent": self.packets_sent,
            "packets_received": self.packets_received,
            "packets_lost": self.packets_lost,
            "packet_loss_pct": self.packet_loss_pct,
            "uptime_seconds": self.uptime_seconds,
            "latest_rssi": self.latest.rssi if self.latest else None,
            "latest_snr": self.latest.snr if self.latest else None,
            "link_state": self.link_state,
        }
