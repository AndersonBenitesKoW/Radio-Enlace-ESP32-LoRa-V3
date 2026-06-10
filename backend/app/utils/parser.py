import json
from datetime import datetime
from typing import Optional
from app.models.telemetry_model import TelemetryPacket, SystemStatus

MIN_RSSI = -120
MAX_RSSI = -20


def signal_strength_pct(rssi: float) -> float:
    raw = (rssi - MIN_RSSI) / (MAX_RSSI - MIN_RSSI) * 100
    return round(max(0.0, min(100.0, raw)), 1)


def link_quality(rssi: float, snr: float) -> str:
    if rssi >= -60 and snr >= 10:
        return "EXCELENTE"
    if rssi >= -80 and snr >= 5:
        return "BUENA"
    if rssi >= -100 and snr >= 0:
        return "REGULAR"
    if rssi >= -115:
        return "MARGINAL"
    return "CRITICA"


def distance_approx(rssi: float, freq_mhz: float = 915.0, tx_power: float = 14.0) -> float:
    dbm = abs(rssi)
    if dbm <= tx_power:
        return 0.0
    fspl = dbm - tx_power
    if fspl <= 0:
        return 0.0
    d_km = 10 ** ((fspl - 32.44 - (20 * __import__("math").log10(freq_mhz))) / 20)
    return round(d_km * 1000, 1)


def parse_serial_line(line: str) -> Optional[TelemetryPacket]:
    try:
        data = json.loads(line.strip())
    except json.JSONDecodeError:
        return None

    if data.get("type") != "telemetry":
        return None

    rssi = float(data.get("rssi", 0))
    snr = float(data.get("snr", 0))
    latency = float(data.get("latency_ms", 0))
    packet_id = int(data.get("packet_id", 0))
    freq_err = float(data.get("frequency_error", 0))

    strength = signal_strength_pct(rssi)
    quality = link_quality(rssi, snr)
    distance = distance_approx(rssi)

    return TelemetryPacket(
        packet_id=packet_id,
        rssi=rssi,
        snr=snr,
        latency_ms=latency,
        signal_strength_pct=strength,
        link_quality=quality,
        distance_approx_m=distance,
        frequency_error_hz=freq_err,
        raw_data=data.get("data", ""),
        timestamp=datetime.now().isoformat(),
    )


def build_status(service_state: dict) -> SystemStatus:
    return SystemStatus(
        transmitter_online=service_state.get("tx_online", True),
        receiver_online=service_state.get("rx_online", True),
        packets_sent=service_state.get("packets_sent", 0),
        packets_received=service_state.get("packets_received", 0),
        packets_lost=service_state.get("packets_lost", 0),
        packet_loss_pct=service_state.get("packet_loss_pct", 0.0),
        uptime_seconds=service_state.get("uptime_seconds", 0),
        latest_rssi=service_state.get("latest_rssi"),
        latest_snr=service_state.get("latest_snr"),
        link_state=service_state.get("link_state", "DESCONOCIDO"),
        timestamp=datetime.now().isoformat(),
    )
