#include <RadioLib.h>
#include "radio_manager.h"
#include "lora_node.h"
#include "crypto_manager.h"

static SX1262 radio = new Module(LORA_NSS, LORA_DIO1, LORA_RST, LORA_BUSY);
static volatile bool receivedFlag = false;

static void IRAM_ATTR onLoRaReceive() {
  receivedFlag = true;
}

static bool transmitAndResume(String payload, const char* originFn) {
  uint8_t cipherBuf[CRYPTO_MAX_PACKET_SIZE];
  size_t cipherLen = 0;

  if (!cryptoEncrypt(payload, cipherBuf, cipherLen, sizeof(cipherBuf))) {
    Serial.print("[ERROR] ");
    Serial.print(originFn);
    Serial.println(": fallo al cifrar el payload, no se transmite");
    return false;
  }

  int state = radio.transmit(cipherBuf, cipherLen);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[ERROR] ");
    Serial.print(originFn);
    Serial.print(": fallo al transmitir. Codigo RadioLib: ");
    Serial.println(state);
  }

  receivedFlag = false;
  int rxState = radio.startReceive();
  if (rxState != RADIOLIB_ERR_NONE) {
    Serial.print("[ERROR] ");
    Serial.print(originFn);
    Serial.print(": fallo al reanudar recepcion tras transmitir. Codigo RadioLib: ");
    Serial.println(rxState);
  }

  return state == RADIOLIB_ERR_NONE;
}

bool radioBegin() {
  int state = radio.begin(LORA_FREQUENCY, LORA_BANDWIDTH, LORA_SPREADING_FACTOR, LORA_CODING_RATE);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[ERROR] radioBegin: radio.begin fallo. Codigo RadioLib: ");
    Serial.println(state);
    return false;
  }

  int powerState = radio.setOutputPower(LORA_TX_POWER);
  if (powerState != RADIOLIB_ERR_NONE) {
    Serial.print("[ERROR] radioBegin: setOutputPower fallo. Codigo RadioLib: ");
    Serial.println(powerState);
  }

  radio.setDio1Action(onLoRaReceive);

  int rxState = radio.startReceive();
  if (rxState != RADIOLIB_ERR_NONE) {
    Serial.print("[ERROR] radioBegin: startReceive inicial fallo. Codigo RadioLib: ");
    Serial.println(rxState);
    return false;
  }

  return true;
}

bool radioPacketAvailable() {
  if (!receivedFlag) {
    return false;
  }
  receivedFlag = false;
  return true;
}

bool radioReadPacket(String& payload) {
  size_t packetLen = radio.getPacketLength();
  if (packetLen == 0) {
    Serial.println("[WARN] radioReadPacket: longitud de paquete reportada es 0");
    return false;
  }
  if (packetLen > CRYPTO_MAX_PACKET_SIZE) {
    Serial.print("[ERROR] radioReadPacket: paquete recibido excede el tamano maximo esperado, longitud=");
    Serial.println(packetLen);
    return false;
  }

  uint8_t cipherBuf[CRYPTO_MAX_PACKET_SIZE];
  int state = radio.readData(cipherBuf, packetLen);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[ERROR] radioReadPacket: readData fallo. Codigo RadioLib: ");
    Serial.println(state);
    return false;
  }

  if (!cryptoDecrypt(cipherBuf, packetLen, payload)) {
    Serial.println("[ERROR] radioReadPacket: fallo al descifrar el paquete recibido");
    return false;
  }

  if (payload.length() == 0) {
    Serial.println("[WARN] radioReadPacket: payload vacio tras descifrar");
    return false;
  }
  return true;
}

bool radioResumeReceive() {
  int rxState = radio.startReceive();
  if (rxState != RADIOLIB_ERR_NONE) {
    Serial.print("[ERROR] radioResumeReceive: fallo al reanudar recepcion. Codigo RadioLib: ");
    Serial.println(rxState);
    return false;
  }
  return true;
}

bool radioSendData(uint32_t id, const char* payload) {
  return transmitAndResume(buildDataPayload(id, payload), "radioSendData");
}

bool radioSendAck(uint32_t id, int16_t rssi, float snr, float freqError) {
  return transmitAndResume(buildAckPayload(id, rssi, snr, freqError), "radioSendAck");
}

bool radioSendChat(uint32_t id, const String& text) {
  return transmitAndResume(buildChatPayload(id, text), "radioSendChat");
}

bool radioSendChatAck(uint32_t id) {
  return transmitAndResume(buildChatAckPayload(id), "radioSendChatAck");
}

int16_t radioGetLastRSSI() {
  return (int16_t)radio.getRSSI();
}

float radioGetLastSNR() {
  return radio.getSNR();
}

float radioGetLastFreqError() {
  return radio.getFrequencyError();
}
