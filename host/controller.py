"""P / PI / PID with conditional anti-windup. Output in [-1, 1]."""
from __future__ import annotations


class PID:
    def __init__(self, kp=1.0, ki=0.0, kd=0.0):
        self.kp, self.ki, self.kd = float(kp), float(ki), float(kd)
        self.integral = 0.0
        self.prev = 0.0
        self.ready = False

    def reset(self):
        self.integral = 0.0
        self.prev = 0.0
        self.ready = False

    def update(self, error, dt, deadband=0.0):
        e = 0.0 if abs(error) < deadband else float(error)
        p = self.kp * e
        d = 0.0
        if self.ready and dt > 1e-6:
            d = self.kd * (e - self.prev) / dt
        tentative = self.integral + e * dt
        out = max(-1.0, min(1.0, p + self.ki * tentative + d))
        saturated = out in (-1.0, 1.0)
        winding = (e > 0 and out > 0) or (e < 0 and out < 0)
        if not (saturated and winding):
            self.integral = max(-2.0, min(2.0, tentative))
        out = max(-1.0, min(1.0, p + self.ki * self.integral + d))
        self.prev, self.ready = e, True
        return out
