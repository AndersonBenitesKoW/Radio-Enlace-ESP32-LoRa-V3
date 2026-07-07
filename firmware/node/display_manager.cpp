#include "display_manager.h"
#include <U8g2lib.h>
#include <Wire.h>
#include "telemetry_manager.h"

static U8G2_SSD1306_128X64_NONAME_1_HW_I2C u8g2(U8G2_R0, /* reset=*/ 21, /* clock=*/ 18, /* data=*/ 17);

void displayManagerBegin() {
  u8g2.begin();
  u8g2.setFont(u8g2_font_6x10_tf);
}

void displayManagerShowMessage(const char* line1, const char* line2) {
  u8g2.firstPage();
  do {
    u8g2.drawStr(0, 15, line1);
    u8g2.drawStr(0, 35, line2);
  } while (u8g2.nextPage());
}

void displayManagerUpdate() {
  char lineId[20];
  char lineRssi[20];
  char lineSnr[20];
  char linePkts[20];

  snprintf(lineId, sizeof(lineId), "ID: %lu", (unsigned long)telemetryManagerLastPacketId());
  snprintf(lineRssi, sizeof(lineRssi), "RSSI: %d dBm", telemetryManagerLastRSSI());
  snprintf(lineSnr, sizeof(lineSnr), "SNR: %.1f dB", telemetryManagerLastSNR());
  snprintf(linePkts, sizeof(linePkts), "TX:%lu RX:%lu",
           (unsigned long)telemetryManagerPacketsTx(),
           (unsigned long)telemetryManagerPacketsRx());

  u8g2.firstPage();
  do {
    u8g2.setFont(u8g2_font_6x10_tf);
    u8g2.drawStr(0, 12, "--- TELEMETRIA ---");
    u8g2.drawStr(0, 26, lineId);
    u8g2.drawStr(0, 39, lineRssi);
    u8g2.drawStr(0, 51, lineSnr);
    u8g2.drawStr(0, 63, linePkts);
  } while (u8g2.nextPage());
}
