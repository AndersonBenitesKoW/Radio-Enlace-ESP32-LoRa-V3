#ifndef RADIO_MANAGER_H
#define RADIO_MANAGER_H

#include <Arduino.h>

bool radioBegin();
bool radioPacketAvailable();
bool radioReadPacket(String& payload);
bool radioResumeReceive();

bool radioSendData(uint32_t id, const char* payload);
bool radioSendAck(uint32_t id, int16_t rssi, float snr, float freqError);
bool radioSendChat(uint32_t id, const String& text);
bool radioSendChatAck(uint32_t id);

int16_t radioGetLastRSSI();
float radioGetLastSNR();
float radioGetLastFreqError();

#endif
