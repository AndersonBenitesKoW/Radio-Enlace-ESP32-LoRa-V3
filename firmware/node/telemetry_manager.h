#ifndef TELEMETRY_MANAGER_H
#define TELEMETRY_MANAGER_H

#include <Arduino.h>

void telemetryManagerPoll();
void telemetryManagerOnDataReceived(const String& raw);
void telemetryManagerOnAckReceived(const String& raw);

uint32_t telemetryManagerPacketsTx();
uint32_t telemetryManagerPacketsRx();
int16_t telemetryManagerLastRSSI();
float telemetryManagerLastSNR();
uint32_t telemetryManagerLastPacketId();

#endif
