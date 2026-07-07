#include "serial_handler.h"
#include "lora_node.h"
#include "radio_manager.h"

static String serialBuffer = "";
static uint32_t nextChatId = 0;
static uint32_t lastSentChatId = 0;
static bool awaitingChatAck = false;

void serialHandlerPoll() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n') {
      serialBuffer.trim();
      if (serialBuffer.startsWith("SEND:") && serialBuffer.length() > 5) {
        String msg = serialBuffer.substring(5);
        nextChatId++;
        lastSentChatId = nextChatId;
        awaitingChatAck = true;

        if (radioSendChat(nextChatId, msg)) {
          Serial.print("[CHAT TX] Enviado por LoRa (id=");
          Serial.print(nextChatId);
          Serial.print("): ");
          Serial.println(msg);
        } else {
          Serial.println("[ERROR] serialHandlerPoll: fallo al enviar el mensaje de chat");
        }
      }
      serialBuffer = "";
    } else if (serialBuffer.length() < 256) {
      serialBuffer += c;
    } else {
      Serial.println("[WARN] serialHandlerPoll: buffer de entrada excedido, descartando linea");
      serialBuffer = "";
    }
  }
}

void serialHandlerOnChatReceived(const String& raw) {
  ChatPacket pkt;
  if (!parseChatPacket(raw, pkt)) {
    return;
  }

  int16_t rssi = radioGetLastRSSI();
  float snr = radioGetLastSNR();

  Serial.print("{\"type\":\"chat\",\"message\":\"");
  Serial.print(pkt.text);
  Serial.print("\",\"rssi\":");
  Serial.print(rssi);
  Serial.print(",\"snr\":");
  Serial.print(snr, 1);
  Serial.println("}");

  if (!radioSendChatAck(pkt.id)) {
    Serial.println("[ERROR] serialHandlerOnChatReceived: fallo al enviar CHAT_ACK");
  }
}

void serialHandlerOnChatAckReceived(const String& raw) {
  uint32_t id;
  if (!parseChatAckId(raw, id)) {
    return;
  }

  if (awaitingChatAck && id == lastSentChatId) {
    awaitingChatAck = false;
    Serial.print("[CHAT] Confirmado por el otro nodo, id=");
    Serial.println(id);
  } else {
    Serial.print("[CHAT] ACK recibido para id=");
    Serial.print(id);
    Serial.println(" (no coincide con el ultimo mensaje enviado)");
  }
}
