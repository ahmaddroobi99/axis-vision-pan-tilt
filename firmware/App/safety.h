#pragma once

#include <stdint.h>

typedef struct {
    uint32_t target_timeout_ms;
    uint32_t uart_timeout_ms;
    uint32_t last_target_ms;
    uint32_t last_uart_ms;
    int estop;
    int motors_enabled;
} safety_t;

void safety_init(safety_t *s, uint32_t target_ms, uint32_t uart_ms);
int safety_should_stop(const safety_t *s, uint32_t now_ms);
