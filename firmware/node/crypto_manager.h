#ifndef CRYPTO_MANAGER_H
#define CRYPTO_MANAGER_H

#include <Arduino.h>

#define CRYPTO_NONCE_SIZE      8
#define CRYPTO_MAX_PACKET_SIZE 128

bool cryptoEncrypt(const String& plaintext, uint8_t* outBuf, size_t& outLen, size_t maxOutLen);
bool cryptoDecrypt(const uint8_t* inBuf, size_t inLen, String& outPlaintext);

#endif
