/* Host-side compile check for the XOR ASCII parser (no STM32 headers). */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

#define PROTOCOL_MAX_PAYLOAD 96

typedef struct {
    char type;
    float x;
    float y;
    uint32_t timestamp;
} protocol_packet_t;

static uint8_t protocol_checksum(const char *payload, uint16_t len) {
    uint8_t cs = 0;
    for (uint16_t i = 0; i < len; i++) cs ^= (uint8_t)payload[i];
    return cs;
}

static int hex_nibble(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'A' && c <= 'F') return 10 + c - 'A';
    if (c >= 'a' && c <= 'f') return 10 + c - 'a';
    return -1;
}

static bool protocol_parse(const char *raw, protocol_packet_t *out) {
    if (!raw || raw[0] != '$') return false;
    const char *star = strrchr(raw, '*');
    if (!star || star <= raw + 1) return false;
    uint16_t len = (uint16_t)(star - raw - 1);
    if (len >= PROTOCOL_MAX_PAYLOAD) return false;
    int hi = hex_nibble(star[1]);
    int lo = hex_nibble(star[2]);
    if (hi < 0 || lo < 0) return false;
    uint8_t got = (uint8_t)((hi << 4) | lo);
    if (got != protocol_checksum(raw + 1, len)) return false;
    char buf[PROTOCOL_MAX_PAYLOAD];
    memcpy(buf, raw + 1, len);
    buf[len] = 0;
    memset(out, 0, sizeof(*out));
    out->type = buf[0];
    if (buf[0] == 'T') {
        char *p = buf + 2;
        out->x = strtof(p, &p);
        if (*p != ',') return false;
        out->y = strtof(p + 1, &p);
        if (*p != ',') return false;
        out->timestamp = (uint32_t)strtoul(p + 1, NULL, 10);
        if (out->x < -1.f || out->x > 1.f || out->y < -1.f || out->y > 1.f) return false;
        return true;
    }
    return buf[0] == 'S' || buf[0] == 'H' || buf[0] == 'E' || buf[0] == 'A';
}

static void xor_hex(const char *payload, char *out) {
    uint8_t cs = protocol_checksum(payload, (uint16_t)strlen(payload));
    sprintf(out, "%02X", cs);
}

int main(void) {
    const char *payload = "T,0.500,-0.250,99";
    char cs[3];
    xor_hex(payload, cs);
    char frame[128];
    snprintf(frame, sizeof(frame), "$%s*%s\r\n", payload, cs);
    protocol_packet_t pkt;
    if (!protocol_parse(frame, &pkt) || pkt.type != 'T') {
        fprintf(stderr, "parse fail\n");
        return 1;
    }
    if (pkt.x < 0.49f || pkt.x > 0.51f) return 2;
    if (!protocol_parse("$S*00\r\n", &pkt)) {
        /* checksum of "S" is 0x53 */
    }
    char sframe[16];
    xor_hex("S", cs);
    snprintf(sframe, sizeof(sframe), "$S*%s\r\n", cs);
    if (!protocol_parse(sframe, &pkt) || pkt.type != 'S') return 3;
    if (protocol_parse("$T,0.1,0.1,1*00\r\n", &pkt)) return 4;
    printf("firmware parser ok\n");
    return 0;
}
