/*
 * Nodo Receptor LoRa 915 MHz
 * Heltec WiFi LoRa 32 V3 - SX1262
 *
 * Recibe paquetes LoRa, mide RSSI/SNR/latencia,
 * envia JSON por Serial USB hacia el backend Python.
 */

#include <RadioLib.h>
#include <U8x8lib.h>

// Heltec WiFi LoRa 32 V3 pinout SX1262
#define LORA_NSS   8
#define LORA_SCK   9
#define LORA_MOSI  10
#define LORA_MISO  11
#define LORA_BUSY  13
#define LORA_RST   12
#define LORA_DIO1  14

#define FREQUENCY      915.0
#define BANDWIDTH      125.0
#define SPREADING_FACTOR 7
#define CODING_RATE    5

SX1262 radio = new Module(LORA_NSS, LORA_DIO1, LORA_RST, LORA_BUSY);
U8X8_SSD1306_128X64_NONAME_HW_I2C display(U8X8_PIN_NONE);

unsigned long lastHeartbeat = 0;
uint32_t packetsReceived = 0;
int lastRSSI = 0;
float lastSNR = 0.0;

void setup() {
  Serial.begin(115200);
  delay(2000);

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  display.begin();
  display.setFont(u8x8_font_chroma48medium8_r);
  display.clearDisplay();
  display.drawString(0, 0, "LoRa RX 915 MHz");
  display.drawString(0, 2, "Iniciando...");

  Serial.println("[RX] Iniciando receptor LoRa 915 MHz");
  Serial.println("[RX] Heltec WiFi LoRa 32 V3 - SX1262");

  int state = radio.begin(FREQUENCY, BANDWIDTH, SPREADING_FACTOR, CODING_RATE);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[RX] Error iniciando radio: ");
    Serial.println(state);
    display.clearDisplay();
    display.drawString(0, 1, "ERROR RADIO");
    while (true) {
      digitalWrite(LED_BUILTIN, HIGH);
      delay(200);
      digitalWrite(LED_BUILTIN, LOW);
      delay(200);
    }
  }

  radio.startReceive();

  Serial.println("[RX] Radio inicializada OK | Escuchando...");

  display.clearDisplay();
  display.drawString(0, 0, "LoRa RX LISTEN");
  display.drawString(0, 2, "F=915.0 SF7");
  display.drawString(0, 3, "Esperando TX...");

  sendHeartbeat();
}

void loop() {
  int state = radio.receive();

  if (state == RADIOLIB_ERR_NONE) {
    digitalWrite(LED_BUILTIN, HIGH);

    packetsReceived++;

    int pktLen = radio.getPacketLength();
    String payload;
    if (pktLen > 0 && pktLen <= 256) {
      uint8_t buf[257];
      int rd = radio.readData(buf, pktLen);
      if (rd == RADIOLIB_ERR_NONE) {
        buf[pktLen] = '\0';
        payload = String((char*)buf);
      }
    }

    lastRSSI = radio.getRSSI();
    lastSNR  = radio.getSNR();
    float freqErr = radio.getFrequencyError();
    unsigned long rxTime = millis();

    // Parse timestamp from payload
    unsigned long txTs = 0;
    uint32_t packetId = 0;
    int idIdx = payload.indexOf("\"id\":");
    int tsIdx = payload.indexOf("\"ts\":");
    if (idIdx >= 0) {
      packetId = payload.substring(idIdx + 5).toInt();
    }
    if (tsIdx >= 0) {
      txTs = payload.substring(tsIdx + 5).toInt();
    }

    unsigned long latency = (txTs > 0) ? (rxTime - txTs) : 0;

    // Build JSON for backend
    Serial.print("{\"type\":\"telemetry\"");
    Serial.print(",\"rssi\":");
    Serial.print(lastRSSI);
    Serial.print(",\"snr\":");
    Serial.print(lastSNR, 1);
    Serial.print(",\"latency_ms\":");
    Serial.print(latency);
    Serial.print(",\"packet_id\":");
    Serial.print(packetId);
    Serial.print(",\"frequency_error\":");
    Serial.print(freqErr, 1);
    Serial.println("}");

    updateDisplay(packetId, lastRSSI, lastSNR);

    digitalWrite(LED_BUILTIN, LOW);
  }

  unsigned long now = millis();
  if (now - lastHeartbeat >= 5000) {
    lastHeartbeat = now;
    sendHeartbeat();
  }
}

void sendHeartbeat() {
  Serial.print("{\"type\":\"heartbeat\"");
  Serial.print(",\"status\":\"online\"");
  Serial.print(",\"uptime\":");
  Serial.print(millis() / 1000);
  Serial.print(",\"packets_rx\":");
  Serial.print(packetsReceived);
  Serial.print(",\"rssi\":");
  Serial.print(lastRSSI);
  Serial.print(",\"snr\":");
  Serial.print(lastSNR, 1);
  Serial.println("}");
}

void updateDisplay(uint32_t id, int rssi, float snr) {
  char line[20];
  display.clearDisplay();

  display.drawString(0, 0, "LoRa RX 915 MHz");

  snprintf(line, sizeof(line), "ID: %lu", id);
  display.drawString(0, 2, line);

  snprintf(line, sizeof(line), "RSSI: %d dBm", rssi);
  display.drawString(0, 3, line);

  snprintf(line, sizeof(line), "SNR: %.1f dB", snr);
  display.drawString(0, 4, line);

  snprintf(line, sizeof(line), "Pkts: %lu", packetsReceived);
  display.drawString(0, 6, line);
}