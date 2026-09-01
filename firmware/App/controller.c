#include "controller.h"

static float clampf(float v, float lo, float hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
}

void pid_reset(pid_state_t *s) {
    s->integral = 0.f;
    s->prev_error = 0.f;
    s->initialized = 0;
}

float pid_update(pid_state_t *s, float error, float dt, float kp, float ki, float kd, float deadband) {
    float e = (error < deadband && error > -deadband) ? 0.f : error;
    float p = kp * e;
    float d = 0.f;
    if (s->initialized && dt > 1e-6f) d = kd * (e - s->prev_error) / dt;
    float tentative = s->integral + e * dt;
    float out = clampf(p + ki * tentative + d, -1.f, 1.f);
    int saturated = (out == 1.f || out == -1.f);
    int winding = (e > 0.f && out > 0.f) || (e < 0.f && out < 0.f);
    if (!(saturated && winding)) s->integral = clampf(tentative, -2.f, 2.f);
    s->prev_error = e;
    s->initialized = 1;
    return clampf(p + ki * s->integral + d, -1.f, 1.f);
}
