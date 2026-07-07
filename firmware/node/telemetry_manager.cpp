#include "telemetry_manager.h"
#include "lora_node.h"
#include "radio_manager.h"

struct PendingSend {
  uint32_t id;
  unsigned long sendTime;
  bool used;
};

static PendingSend rttTable[RTT_TABLE_SIZE];
static uint8_t rttCursor = 0;

static unsigned long lastPacketTime = 0;
static unsigned long lastHeartbeat = 0;
static unsigned long currentInterval = TX_INTERVAL_BASE_MS;

static uint32_t packetsTx = 0;
static uint32_t packetsRx = 0;
static int16_t lastRSSI = 0;
static float lastSNR = 0.0;
static uint32_t lastPacketId = 0;

static void rttTableInsert(uint32_t id) {
  rttTable[rttCursor].id = id;
  rttTable[rttCursor].sendTime = millis();
  rttTable[rttCursor].used = true;
  rttCursor = (rttCursor + 1) % RTT_TABLE_SIZE;
}

static bool rttTableTakeLatency(uint32_t id, unsigned long& latencyOut) {
  for (uint8_t i = 0; i < RTT_TABLE_SIZE; i++) {
    if (rttTable[i].used && rttTable[i].id == id) {
      latencyOut = millis() - rttTable[i].sendTime;
      rttTable[i].used = false;
      return true;
    }
  }
  return false;
}

static unsigned long nextInterval() {
  long jitter = random(-TX_INTERVAL_JITTER_MS, TX_INTERVAL_JITTER_MS + 1);
  return TX_INTERVAL_BASE_MS + jitter;
}

void telemetryManagerPoll() {
  unsigned long now = millis();

  if (now - lastPacketTime >= currentInterval) {
    lastPacketTime = now;
    currentInterval = nextInterval();
    packetsTx++;

    if (radioSendData(packetsTx, "radioenlace exitoso")) {
      rttTableInsert(packetsTx);
    } else {
      Serial.println("[ERROR] telemetryManagerPoll: fallo al enviar DATA periodico");
    }
  }

  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = now;
    Serial.print("{\"type\":\"heartbeat\"");
    Serial.print(",\"status\":\"online\"");
    Serial.print(",\"uptime\":");
    Serial.print(millis() / 1000);
    Serial.print(",\"packets_tx\":");
    Serial.print(packetsTx);
    Serial.print(",\"packets_rx\":");
    Serial.print(packetsRx);
    Serial.print(",\"rssi\":");
    Serial.print(lastRSSI);
    Serial.print(",\"snr\":");
    Serial.print(lastSNR, 1);
    Serial.println("}");
  }
}

void telemetryManagerOnDataReceived(const String& raw) {
  DataPacket pkt;
  if (!parseDataPacket(raw, pkt)) {
    return;
  }

  packetsRx++;
  lastRSSI = radioGetLastRSSI();
  lastSNR = radioGetLastSNR();
  float freqErr = radioGetLastFreqError();
  lastPacketId = pkt.id;

  Serial.print("{\"type\":\"telemetry\"");
  Serial.print(",\"rssi\":");
  Serial.print(lastRSSI);
  Serial.print(",\"snr\":");
  Serial.print(lastSNR, 1);
  Serial.print(",\"latency_ms\":0");
  Serial.print(",\"packet_id\":");
  Serial.print(pkt.id);
  Serial.print(",\"frequency_error\":");
  Serial.print(freqErr, 1);
  Serial.print(",\"data\":\"");
  Serial.print(pkt.payload);
  Serial.println("\"}");

  if (!radioSendAck(pkt.id, lastRSSI, lastSNR, freqErr)) {
    Serial.println("[ERROR] telemetryManagerOnDataReceived: fallo al enviar ACK");
  }
}

void telemetryManagerOnAckReceived(const String& raw) {
  AckPacket pkt;
  if (!parseAckPacket(raw, pkt)) {
    return;
  }

  unsigned long latency = 0;
  if (!rttTableTakeLatency(pkt.id, latency)) {
    Serial.print("[WARN] telemetryManagerOnAckReceived: ACK sin envio pendiente registrado, id=");
    Serial.println(pkt.id);
  }

  Serial.print("{\"type\":\"telemetry\"");
  Serial.print(",\"rssi\":");
  Serial.print(pkt.rssi);
  Serial.print(",\"snr\":");
  Serial.print(pkt.snr, 1);
  Serial.print(",\"latency_ms\":");
  Serial.print(latency);
  Serial.print(",\"packet_id\":");
  Serial.print(pkt.id);
  Serial.print(",\"frequency_error\":");
  Serial.print(pkt.freqError, 1);
  Serial.print(",\"data\":\"radioenlace exitoso\"");
  Serial.println("}");
}

uint32_t telemetryManagerPacketsTx() {
  return packetsTx;
}

uint32_t telemetryManagerPacketsRx() {
  return packetsRx;
}

int16_t telemetryManagerLastRSSI() {
  return lastRSSI;
}

float telemetryManagerLastSNR() {
  return lastSNR;
}

uint32_t telemetryManagerLastPacketId() {
  return lastPacketId;
}
