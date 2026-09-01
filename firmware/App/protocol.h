#pragma once

#include <stdint.h>
#include <stdbool.h>

#define PROTOCOL_MAX_PAYLOAD 96

typedef struct {
    char type;
    float x;
    float y;
    uint32_t timestamp;
} protocol_packet_t;

uint8_t protocol_checksum(const char *payload, uint16_t len);
bool protocol_parse(const char *raw, protocol_packet_t *out);
