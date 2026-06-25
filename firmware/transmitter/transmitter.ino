/*
 * ================================================================================
 * NODO TRANSCEPTOR TX - TELEMETRIA + CHAT BIDIRECCIONAL
 * ================================================================================
 * Hardware: Heltec WiFi LoRa 32 V3 (ESP32-S3) + SX1262
 * - Envia telemetria cada 1s con formato "ID|radioenlace exitoso"
 * - Recibe mensajes de chat por LoRa y los imprime a Serial como JSON
 * - Lee comandos del PC via Serial (formato "SEND:texto") y los transmite
 * ================================================================================
 */

// void setup() {
//   Serial.begin(115200);
//   delay(1000);
//   Serial.println("PRUEBA");
// }

// void loop() {
//   Serial.println(".");
//   delay(1000);
// }
#include <RadioLib.h>

// Pines físicos del chip SX1262 en Heltec V3
#define LORA_NSS    8
#define LORA_SCK    9
#define LORA_MOSI  10
#define LORA_MISO  11
#define LORA_BUSY  13
#define LORA_RST   12
#define LORA_DIO1  14

// Configuración de Radiofrecuencia (Alineado con tus pruebas)
#define FREQUENCY      915.0   // Banda de frecuencia de tu proyecto
#define BANDWIDTH      125.0   
#define SPREADING_FACTOR 7     
#define CODING_RATE     5      
#define TX_POWER        14     
#define PACKET_INTERVAL_MS 1000 // Envía exactamente cada 1 segundo

SX1262 radio = new Module(LORA_NSS, LORA_DIO1, LORA_RST, LORA_BUSY);

unsigned long lastPacketTime = 0;
uint32_t packetCounter = 0;
String serialBuffer = "";

void setup() {
  Serial.begin(115200);
  delay(2000); // Tiempo prudencial para abrir el Monitor Serie

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  Serial.println("\n==================================================");
  Serial.println("[EMISOR-TX] INICIANDO TRANSMISIÓN TOKENIZADA...");
  Serial.println("==================================================");

  int state = radio.begin(FREQUENCY, BANDWIDTH, SPREADING_FACTOR, CODING_RATE);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.print("[FALLO] El procesador no detecta el hardware LoRa. Código: ");
    Serial.println(state);
    while (true) {
      digitalWrite(LED_BUILTIN, HIGH);
      delay(100);
      digitalWrite(LED_BUILTIN, LOW);
      delay(100);
    }
  }

  radio.setOutputPower(TX_POWER);
  Serial.println("[INFO] Chip SX1262 en línea y calibrado en 915.0 MHz.");
  Serial.println("[INFO] Sincronización por token '|' habilitada.");
  Serial.println("[INFO] Modo TRANSCEPTOR - Chat bidireccional activo.\n");
  radio.startReceive();
}

void checkSerialCommand() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n') {
      serialBuffer.trim();
      if (serialBuffer.startsWith("SEND:") && serialBuffer.length() > 5) {
        String msg = serialBuffer.substring(5);
        String loraPayload = "CHAT|" + msg;
        radio.transmit(loraPayload);
        Serial.print("[CHAT TX] Enviado por LoRa: ");
        Serial.println(msg);
        radio.startReceive();
      }
      serialBuffer = "";
    } else if (serialBuffer.length() < 256) {
      serialBuffer += c;
    }
  }
}

void loop() {
  checkSerialCommand();

  String rxPayload;
  int rxState = radio.receive(rxPayload);
  if (rxState == RADIOLIB_ERR_NONE && rxPayload.length() > 0) {
    if (rxPayload.startsWith("CHAT|")) {
      String chatMsg = rxPayload.substring(5);
      int chatRssi = radio.getRSSI();
      float chatSnr = radio.getSNR();
      Serial.print("{\"type\":\"chat\",\"message\":\"");
      Serial.print(chatMsg);
      Serial.print("\",\"rssi\":");
      Serial.print(chatRssi);
      Serial.print(",\"snr\":");
      Serial.print(chatSnr, 1);
      Serial.println("}");
    }
  }

  unsigned long now = millis();

  if (now - lastPacketTime >= PACKET_INTERVAL_MS) {
    lastPacketTime = now;
    packetCounter++;

    char payload[60];
    snprintf(payload, sizeof(payload), "%lu|radioenlace exitoso", packetCounter);

    digitalWrite(LED_BUILTIN, HIGH);

    int state = radio.transmit(payload);
    
    Serial.println("--------------------------------------------------");
    Serial.print("[TX ACTIVO] Ráfaga electromagnética enviada... ID: ");
    Serial.println(packetCounter);
    Serial.print("[PAYLOAD EMITIDO]: "); 
    Serial.println(payload);
    
    if (state == RADIOLIB_ERR_NONE) {
      Serial.println("[ESTADO] -> ¡Enviado físicamente con éxito!");
    } else {
      Serial.print("[ESTADO] -> ¡ERROR EN EL AIRE! Código RadioLib: ");
      Serial.println(state);
    }
    Serial.println("--------------------------------------------------");

    digitalWrite(LED_BUILTIN, LOW);
    radio.startReceive();
  }
}