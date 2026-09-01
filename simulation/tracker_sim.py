"""Closed-loop plant sim without camera or STM32.

python3 simulation/tracker_sim.py
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from host.controller import PID
from host.tracker import apply_deadband, exp_smooth


def step_motor(pos, vel, target, dt, max_speed, accel, limit):
    target = max(-max_speed, min(max_speed, target))
    dv = max(-accel * dt, min(accel * dt, target - vel))
    vel = max(-max_speed, min(max_speed, vel + dv))
    pos = pos + vel * dt
    if pos > limit:
        pos, vel = limit, min(0.0, vel)
    if pos < -limit:
        pos, vel = -limit, max(0.0, vel)
    return pos, vel


def main():
    dt = 1.0 / 200.0
    host_every = int(200 / 30)
    pid = PID(1.15, 0.0, 0.08)
    pan = vel = 0.0
    fx = 0.0
    t = 0.0
    log = []
    for k in range(2000):
        t = k * dt
        world = 22.0 * math.sin(t * 0.6)
        if k % host_every == 0:
            nx = max(-1.0, min(1.0, (world - pan) / 30.0))
            fx = exp_smooth(fx, nx, 0.25)
            cmd = pid.update(apply_deadband(fx, 0.04), 1 / 30)
            target_vel = cmd * 70.0
        pan, vel = step_motor(pan, vel, target_vel, dt, 70.0, 220.0, 85.0)
        if k % 10 == 0:
            log.append((t, world, pan, world - pan, vel))

    print(f"{'t':>6} {'target':>8} {'camera':>8} {'err':>8} {'vel':>8}")
    for row in log[::20]:
        print(f"{row[0]:6.2f} {row[1]:8.2f} {row[2]:8.2f} {row[3]:8.2f} {row[4]:8.2f}")

    try:
        import matplotlib.pyplot as plt

        ts, tgt, cam, err, vels = zip(*log)
        fig, ax = plt.subplots(3, 1, figsize=(8, 7), sharex=True)
        ax[0].plot(ts, tgt, label="target az")
        ax[0].plot(ts, cam, label="camera pan")
        ax[0].legend()
        ax[1].plot(ts, err, color="#8fa38a")
        ax[1].set_ylabel("error deg")
        ax[2].plot(ts, vels, color="#c8cdc4")
        ax[2].set_ylabel("vel deg/s")
        ax[2].set_xlabel("t (s)")
        fig.tight_layout()
        out = ROOT / "docs" / "media" / "sim_response.png"
        fig.savefig(out, dpi=120)
        print("wrote", out)
    except Exception as exc:
        print("plot skipped:", exc)


if __name__ == "__main__":
    main()
