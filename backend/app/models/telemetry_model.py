from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TelemetryPacket(BaseModel):
    packet_id: int
    rssi: float
    snr: float
    latency_ms: float
    signal_strength_pct: float
    link_quality: str
    distance_approx_m: float
    frequency_error_hz: float
    raw_data: str
    timestamp: str


class SystemStatus(BaseModel):
    transmitter_online: bool
    receiver_online: bool
    packets_sent: int
    packets_received: int
    packets_lost: int
    packet_loss_pct: float
    uptime_seconds: int
    latest_rssi: Optional[float] = None
    latest_snr: Optional[float] = None
    link_state: str
    timestamp: str


class HistoricalRecord(BaseModel):
    records: list[TelemetryPacket]
    total: int
