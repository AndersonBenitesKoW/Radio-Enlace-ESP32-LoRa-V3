/*
 * ================================================================================
 * NODO TRANSMISOR FINAL (EMISOR - TX) - MODO TOKENIZADO SANO
 * ================================================================================
 * Hardware: Heltec WiFi LoRa 32 V3 (ESP32-S3) + SX1262
 * Objetivo: Enviar el ID incrustado junto a la oración fija usando un token '|'
 * para garantizar la sincronización matemática absoluta con el Receptor.
 * ================================================================================
 */

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
  Serial.println("[INFO] Sincronización por token '|' habilitada.\n");
}

void loop() {
  unsigned long now = millis();

  if (now - lastPacketTime >= PACKET_INTERVAL_MS) {
    lastPacketTime = now;
    packetCounter++; // Incremento secuencial del identificador real

    // Estructuramos el mensaje inyectando el ID separado por el token '|'
    // Formato resultante en el aire: "1|radioenlace exitoso", "2|radioenlace exitoso"...
    char payload[60];
    snprintf(payload, sizeof(payload), "%lu|radioenlace exitoso", packetCounter);

    // Destello del LED testigo físico al iniciar transmisión
    digitalWrite(LED_BUILTIN, HIGH);

    // Transmisión inalámbrica real por RF a 915 MHz
    int state = radio.transmit(payload);
    
    // Reporte detallado para control de logs y depuración en PC
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

    // Apagamos el LED indicando que el paquete terminó de salir
    digitalWrite(LED_BUILTIN, LOW);
  }
}