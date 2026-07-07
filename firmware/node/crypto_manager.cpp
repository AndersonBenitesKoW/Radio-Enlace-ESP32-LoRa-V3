#include "crypto_manager.h"
#include <string.h>
#include <mbedtls/aes.h>

// Clave AES-128 precompartida: debe ser identica y estar en secreto en ambas placas.
static const uint8_t AES_KEY[16] = {
  0x4C, 0x6F, 0x52, 0x61, 0x2D, 0x45, 0x6E, 0x6C,
  0x61, 0x63, 0x65, 0x2D, 0x32, 0x30, 0x32, 0x36
};

static bool aesCtrCrypt(const uint8_t* input, size_t len, const uint8_t* nonce, uint8_t* output, const char* originFn) {
  mbedtls_aes_context aes;
  mbedtls_aes_init(&aes);

  int setKeyResult = mbedtls_aes_setkey_enc(&aes, AES_KEY, 128);
  if (setKeyResult != 0) {
    Serial.print("[ERROR] ");
    Serial.print(originFn);
    Serial.print(": mbedtls_aes_setkey_enc fallo, codigo=");
    Serial.println(setKeyResult);
    mbedtls_aes_free(&aes);
    return false;
  }

  uint8_t nonceCounter[16] = {0};
  memcpy(nonceCounter, nonce, CRYPTO_NONCE_SIZE);

  uint8_t streamBlock[16] = {0};
  size_t nc_off = 0;

  int cryptResult = mbedtls_aes_crypt_ctr(&aes, len, &nc_off, nonceCounter, streamBlock, input, output);
  mbedtls_aes_free(&aes);

  if (cryptResult != 0) {
    Serial.print("[ERROR] ");
    Serial.print(originFn);
    Serial.print(": mbedtls_aes_crypt_ctr fallo, codigo=");
    Serial.println(cryptResult);
    return false;
  }

  return true;
}

bool cryptoEncrypt(const String& plaintext, uint8_t* outBuf, size_t& outLen, size_t maxOutLen) {
  size_t len = plaintext.length();
  if (CRYPTO_NONCE_SIZE + len > maxOutLen) {
    Serial.println("[ERROR] cryptoEncrypt: buffer de salida insuficiente para el mensaje");
    return false;
  }

  uint8_t nonce[CRYPTO_NONCE_SIZE];
  for (size_t i = 0; i < CRYPTO_NONCE_SIZE; i++) {
    nonce[i] = (uint8_t)random(0, 256);
  }

  if (!aesCtrCrypt((const uint8_t*)plaintext.c_str(), len, nonce, outBuf + CRYPTO_NONCE_SIZE, "cryptoEncrypt")) {
    return false;
  }

  memcpy(outBuf, nonce, CRYPTO_NONCE_SIZE);
  outLen = CRYPTO_NONCE_SIZE + len;
  return true;
}

bool cryptoDecrypt(const uint8_t* inBuf, size_t inLen, String& outPlaintext) {
  if (inLen <= CRYPTO_NONCE_SIZE) {
    Serial.println("[ERROR] cryptoDecrypt: paquete demasiado corto para contener nonce y datos");
    return false;
  }

  size_t cipherLen = inLen - CRYPTO_NONCE_SIZE;
  if (cipherLen >= CRYPTO_MAX_PACKET_SIZE) {
    Serial.println("[ERROR] cryptoDecrypt: paquete cifrado excede el tamano maximo esperado");
    return false;
  }

  uint8_t plainBuf[CRYPTO_MAX_PACKET_SIZE];
  if (!aesCtrCrypt(inBuf + CRYPTO_NONCE_SIZE, cipherLen, inBuf, plainBuf, "cryptoDecrypt")) {
    return false;
  }

  outPlaintext = "";
  outPlaintext.reserve(cipherLen);
  for (size_t i = 0; i < cipherLen; i++) {
    outPlaintext += (char)plainBuf[i];
  }
  return true;
}
