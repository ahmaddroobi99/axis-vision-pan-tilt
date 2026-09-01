#pragma once

typedef struct {
    float integral;
    float prev_error;
    int initialized;
} pid_state_t;

void pid_reset(pid_state_t *s);
float pid_update(pid_state_t *s, float error, float dt, float kp, float ki, float kd, float deadband);
