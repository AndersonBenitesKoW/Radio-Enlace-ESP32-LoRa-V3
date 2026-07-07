#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Arduino.h>

void displayManagerBegin();
void displayManagerShowMessage(const char* line1, const char* line2);
void displayManagerUpdate();

#endif
