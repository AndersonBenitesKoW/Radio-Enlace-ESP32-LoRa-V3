#ifndef SERIAL_HANDLER_H
#define SERIAL_HANDLER_H

#include <Arduino.h>

void serialHandlerPoll();
void serialHandlerOnChatReceived(const String& raw);
void serialHandlerOnChatAckReceived(const String& raw);

#endif
