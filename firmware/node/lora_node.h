#ifndef LORA_NODE_H
#define LORA_NODE_H

#include <Arduino.h>

#define LORA_NSS    8
#define LORA_SCK    9
#define LORA_MOSI  10
#define LORA_MISO  11
#define LORA_BUSY  13
#define LORA_RST   12
#define LORA_DIO1  14

#define LORA_FREQUENCY        915.0
#define LORA_BANDWIDTH        125.0
#define LORA_SPREADING_FACTOR 7
#define LORA_CODING_RATE      5
#define LORA_TX_POWER         14

#define NODE_ROLE_TX 0
#define NODE_ROLE_RX 1

#define TX_INTERVAL_BASE_MS   1000
#define TX_INTERVAL_JITTER_MS 100
#define HEARTBEAT_INTERVAL_MS 5000
#define RTT_TABLE_SIZE        8

#define LORA_PREFIX_DATA     "DATA|"
#define LORA_PREFIX_ACK      "ACK|"
#define LORA_PREFIX_CHAT     "CHAT|"
#define LORA_PREFIX_CHAT_ACK "CHAT_ACK|"

struct DataPacket {
  uint32_t id;
  char payload[48];
};

struct AckPacket {
  uint32_t id;
  int16_t rssi;
  float snr;
  float freqError;
};

struct ChatPacket {
  uint32_t id;
  char text[64];
};

bool nextField(const String& str, int& cursor, String& outField);

bool parseDataPacket(const String& raw, DataPacket& pkt);
bool parseAckPacket(const String& raw, AckPacket& pkt);
bool parseChatPacket(const String& raw, ChatPacket& pkt);
bool parseChatAckId(const String& raw, uint32_t& id);

String buildDataPayload(uint32_t id, const char* payload);
String buildAckPayload(uint32_t id, int16_t rssi, float snr, float freqError);
String buildChatPayload(uint32_t id, const String& text);
String buildChatAckPayload(uint32_t id);

#endif
