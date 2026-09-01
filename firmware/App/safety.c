#include "safety.h"

void safety_init(safety_t *s, uint32_t target_ms, uint32_t uart_ms) {
    s->target_timeout_ms = target_ms;
    s->uart_timeout_ms = uart_ms;
    s->last_target_ms = 0;
    s->last_uart_ms = 0;
    s->estop = 0;
    s->motors_enabled = 0;
}

int safety_should_stop(const safety_t *s, uint32_t now_ms) {
    if (s->estop) return 1;
    if (now_ms - s->last_target_ms > s->target_timeout_ms) return 1;
    if (now_ms - s->last_uart_ms > s->uart_timeout_ms) return 1;
    return 0;
}
