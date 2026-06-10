export interface TelemetryPacket {
  packet_id: number;
  rssi: number;
  snr: number;
  latency_ms: number;
  signal_strength_pct: number;
  link_quality: string;
  distance_approx_m: number;
  frequency_error_hz: number;
  raw_data: string;
  timestamp: string;
}

export interface SystemState {
  tx_online: boolean;
  rx_online: boolean;
  packets_sent: number;
  packets_received: number;
  packets_lost: number;
  packet_loss_pct: number;
  uptime_seconds: number;
  latest_rssi: number | null;
  latest_snr: number | null;
  link_state: string;
}
