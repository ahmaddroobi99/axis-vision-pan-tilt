#include "motor.h"

static float clampf(float v, float lo, float hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
}

void motor_step(motor_axis_t *ax, float dt) {
    if (!ax->enabled) {
        ax->current_vel = 0.f;
        ax->target_vel = 0.f;
        return;
    }
    float target = clampf(ax->target_vel, -ax->max_speed, ax->max_speed);
    float max_dv = ax->acceleration * dt;
    float dv = target - ax->current_vel;
    if (dv > max_dv) dv = max_dv;
    if (dv < -max_dv) dv = -max_dv;
    ax->current_vel = clampf(ax->current_vel + dv, -ax->max_speed, ax->max_speed);
    ax->position_deg += ax->current_vel * dt;
    if (ax->position_deg > ax->limit_deg) {
        ax->position_deg = ax->limit_deg;
        if (ax->current_vel > 0) ax->current_vel = 0;
    } else if (ax->position_deg < -ax->limit_deg) {
        ax->position_deg = -ax->limit_deg;
        if (ax->current_vel < 0) ax->current_vel = 0;
    }
}
