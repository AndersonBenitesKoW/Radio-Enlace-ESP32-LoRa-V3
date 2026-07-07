#include "lora_node.h"

bool nextField(const String& str, int& cursor, String& outField) {
  if (cursor < 0 || cursor > (int)str.length()) {
    Serial.println("[ERROR] lora_node::nextField - cursor fuera de rango");
    return false;
  }
  int sep = str.indexOf('|', cursor);
  if (sep < 0) {
    outField = str.substring(cursor);
    cursor = str.length() + 1;
  } else {
    outField = str.substring(cursor, sep);
    cursor = sep + 1;
  }
  return true;
}

bool parseDataPacket(const String& raw, DataPacket& pkt) {
  if (!raw.startsWith(LORA_PREFIX_DATA)) {
    Serial.println("[ERROR] parseDataPacket: prefijo invalido");
    return false;
  }

  int cursor = strlen(LORA_PREFIX_DATA);
  String idField;
  if (!nextField(raw, cursor, idField) || idField.length() == 0) {
    Serial.println("[ERROR] parseDataPacket: campo id vacio o malformado");
    return false;
  }
  if (cursor > (int)raw.length()) {
    Serial.println("[ERROR] parseDataPacket: falta el payload");
    return false;
  }

  pkt.id = (uint32_t)idField.toInt();

  String payload = raw.substring(cursor);
  size_t len = payload.length();
  if (len >= sizeof(pkt.payload)) {
    Serial.print("[WARN] parseDataPacket: payload truncado, longitud original=");
    Serial.println(len);
    len = sizeof(pkt.payload) - 1;
  }
  payload.toCharArray(pkt.payload, len + 1);
  return true;
}

bool parseAckPacket(const String& raw, AckPacket& pkt) {
  if (!raw.startsWith(LORA_PREFIX_ACK)) {
    Serial.println("[ERROR] parseAckPacket: prefijo invalido");
    return false;
  }

  int cursor = strlen(LORA_PREFIX_ACK);
  String idField, rssiField, snrField, freqField;

  if (!nextField(raw, cursor, idField) || idField.length() == 0) {
    Serial.println("[ERROR] parseAckPacket: campo id vacio o malformado");
    return false;
  }
  if (!nextField(raw, cursor, rssiField) || rssiField.length() == 0) {
    Serial.println("[ERROR] parseAckPacket: campo rssi vacio o malformado");
    return false;
  }
  if (!nextField(raw, cursor, snrField) || snrField.length() == 0) {
    Serial.println("[ERROR] parseAckPacket: campo snr vacio o malformado");
    return false;
  }
  if (!nextField(raw, cursor, freqField) || freqField.length() == 0) {
    Serial.println("[ERROR] parseAckPacket: campo freq_error vacio o malformado");
    return false;
  }

  pkt.id = (uint32_t)idField.toInt();
  pkt.rssi = (int16_t)rssiField.toInt();
  pkt.snr = snrField.toFloat();
  pkt.freqError = freqField.toFloat();
  return true;
}

bool parseChatPacket(const String& raw, ChatPacket& pkt) {
  if (!raw.startsWith(LORA_PREFIX_CHAT)) {
    Serial.println("[ERROR] parseChatPacket: prefijo invalido");
    return false;
  }

  int cursor = strlen(LORA_PREFIX_CHAT);
  String idField;
  if (!nextField(raw, cursor, idField) || idField.length() == 0) {
    Serial.println("[ERROR] parseChatPacket: campo id vacio o malformado");
    return false;
  }
  if (cursor > (int)raw.length()) {
    Serial.println("[ERROR] parseChatPacket: falta el texto del mensaje");
    return false;
  }

  pkt.id = (uint32_t)idField.toInt();

  String text = raw.substring(cursor);
  size_t len = text.length();
  if (len >= sizeof(pkt.text)) {
    Serial.print("[WARN] parseChatPacket: texto truncado, longitud original=");
    Serial.println(len);
    len = sizeof(pkt.text) - 1;
  }
  text.toCharArray(pkt.text, len + 1);
  return true;
}

bool parseChatAckId(const String& raw, uint32_t& id) {
  if (!raw.startsWith(LORA_PREFIX_CHAT_ACK)) {
    Serial.println("[ERROR] parseChatAckId: prefijo invalido");
    return false;
  }
  String idField = raw.substring(strlen(LORA_PREFIX_CHAT_ACK));
  if (idField.length() == 0) {
    Serial.println("[ERROR] parseChatAckId: campo id vacio");
    return false;
  }
  id = (uint32_t)idField.toInt();
  return true;
}

String buildDataPayload(uint32_t id, const char* payload) {
  String out = LORA_PREFIX_DATA;
  out += String(id);
  out += "|";
  out += payload;
  return out;
}

String buildAckPayload(uint32_t id, int16_t rssi, float snr, float freqError) {
  String out = LORA_PREFIX_ACK;
  out += String(id);
  out += "|";
  out += String(rssi);
  out += "|";
  out += String(snr, 1);
  out += "|";
  out += String(freqError, 1);
  return out;
}

String buildChatPayload(uint32_t id, const String& text) {
  return String(LORA_PREFIX_CHAT) + String(id) + "|" + text;
}

String buildChatAckPayload(uint32_t id) {
  return String(LORA_PREFIX_CHAT_ACK) + String(id);
}
