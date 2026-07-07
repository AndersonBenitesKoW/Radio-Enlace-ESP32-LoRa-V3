/*
 * ================================================================================
 * NODO LORA SIMETRICO - TELEMETRIA + CHAT BIDIRECCIONAL CON ACK
 * Hardware: Heltec WiFi LoRa 32 V3 (ESP32-S3) + SX1262
 * Mismo firmware para ambas placas: cambiar NODE_ROLE y recompilar por placa.
 * ================================================================================
 */

#include "lora_node.h"

#define NODE_ROLE NODE_ROLE_RX

#include "radio_manager.h"
#include "serial_handler.h"
#include "telemetry_manager.h"
#include "display_manager.h"

static bool ledPending = false;
static unsigned long ledOffAt = 0;

static void triggerLedBlink() {
  digitalWrite(LED_BUILTIN, HIGH);
  ledOffAt = millis() + 20;
  ledPending = true;
}

static void serviceLedBlink() {
  if (ledPending && millis() >= ledOffAt) {
    digitalWrite(LED_BUILTIN, LOW);
    ledPending = false;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  displayManagerBegin();
  displayManagerShowMessage("NODO LORA", NODE_ROLE == NODE_ROLE_TX ? "ROL: TX" : "ROL: RX");

  if (!radioBegin()) {
    Serial.println("[FALLO] setup: no se pudo inicializar el radio SX1262. Deteniendo.");
    while (true) {
      digitalWrite(LED_BUILTIN, HIGH);
      delay(100);
      digitalWrite(LED_BUILTIN, LOW);
      delay(100);
    }
  }

  Serial.print("[INFO] Nodo LoRa inicializado. Rol: ");
  Serial.println(NODE_ROLE == NODE_ROLE_TX ? "TX" : "RX");
}

void loop() {
  serviceLedBlink();
  serialHandlerPoll();

  if (radioPacketAvailable()) {
    String raw;
    if (radioReadPacket(raw)) {
      triggerLedBlink();

      if (raw.startsWith(LORA_PREFIX_CHAT_ACK)) {
        serialHandlerOnChatAckReceived(raw);
      } else if (raw.startsWith(LORA_PREFIX_CHAT)) {
        serialHandlerOnChatReceived(raw);
      } else if (raw.startsWith(LORA_PREFIX_ACK)) {
        telemetryManagerOnAckReceived(raw);
      } else if (raw.startsWith(LORA_PREFIX_DATA)) {
        telemetryManagerOnDataReceived(raw);
        displayManagerUpdate();
      } else {
        Serial.println("[WARN] loop: payload con prefijo desconocido, descartado");
      }
    }
    radioResumeReceive();
  }

  telemetryManagerPoll();
}
