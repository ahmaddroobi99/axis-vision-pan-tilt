#pragma once

typedef struct {
    float position_deg;
    float current_vel;
    float target_vel;
    float max_speed;
    float acceleration;
    float limit_deg;
    int enabled;
} motor_axis_t;

void motor_step(motor_axis_t *ax, float dt);
