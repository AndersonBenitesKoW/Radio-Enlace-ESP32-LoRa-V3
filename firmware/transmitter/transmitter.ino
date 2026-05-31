/*
 * Nodo Transmisor LoRa 915 MHz
 * Heltec WiFi LoRa 32 V3 - SX1262
 *
 * Envia paquetes JSON periodicamente para testear el radioenlace.
 * Cada paquete contiene ID secuencial y timestamp.
 */

#include <RadioLib.h>

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
#define TX_POWER       14
#define PACKET_INTERVAL_MS 1000

SX1262 radio = new Module(LORA_NSS, LORA_DIO1, LORA_RST, LORA_BUSY);

unsigned long lastPacketTime = 0;
uint32_t packetCounter = 0;

void setup() {
  Serial.begin(115200);
  delay(2000);

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  Serial.println("[TX] Iniciando transmisor LoRa 915 MHz");
  Serial.println("[TX] Heltec WiFi LoRa 32 V3 - SX1262");

  int state = radio.begin(FREQUENCY, BANDWIDTH, SPREADING_FACTOR, CODING_RATE);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[TX] Error iniciando radio: ");
    Serial.println(state);
    while (true) {
      digitalWrite(LED_BUILTIN, HIGH);
      delay(200);
      digitalWrite(LED_BUILTIN, LOW);
      delay(200);
    }
  }

  radio.setOutputPower(TX_POWER);

  Serial.println("[TX] Radio inicializada OK");
  Serial.println("[TX] Frecuencia: 915.0 MHz, SF7, BW125, CR4/5");
  Serial.println("[TX] Transmitiendo cada 1000 ms...");
}

void loop() {
  unsigned long now = millis();

  if (now - lastPacketTime >= PACKET_INTERVAL_MS) {
    lastPacketTime = now;
    packetCounter++;

    char payload[80];
    snprintf(payload, sizeof(payload),
             "{\"id\":%lu,\"ts\":%lu}",
             packetCounter, now);

    digitalWrite(LED_BUILTIN, HIGH);

    int state = radio.transmit(payload);
    if (state == RADIOLIB_ERR_NONE) {
      Serial.print("[TX] Paquete #");
      Serial.print(packetCounter);
      Serial.print(" enviado OK | Payload: ");
      Serial.println(payload);
    } else {
      Serial.print("[TX] Error TX: ");
      Serial.println(state);
    }

    digitalWrite(LED_BUILTIN, LOW);
  }
}
