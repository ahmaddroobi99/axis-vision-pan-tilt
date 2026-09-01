#!/usr/bin/env python3
"""Interactive jog / gain notes. Requires a live UART for hardware; otherwise prints the procedure."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from host.protocol import encode_stop, encode_target


STEPS = """
1. Logic only. Motors unpowered. EN inactive.
2. Send heartbeat, confirm parser ACK.
3. Jog: left / right / up / down / center / stop.
4. If an axis is inverted, flip DIR — not PID.
5. Power motors at low current. Repeat jog.
6. Raise Kp from 0.4 until a walking subject stays in frame.
7. If it rings, drop Kp, add a little Kd. Keep Ki at 0.
"""


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--port", default="")
    args = p.parse_args()
    print(STEPS)
    cmds = {
        "left": encode_target(-0.55, 0, 0),
        "right": encode_target(0.55, 0, 0),
        "up": encode_target(0, -0.45, 0),
        "down": encode_target(0, 0.45, 0),
        "center": encode_target(0, 0, 0),
        "stop": encode_stop(),
    }
    if not args.port:
        for name, pkt in cmds.items():
            print(f"{name:8} {pkt.strip()}")
        return
    import serial

    ser = serial.Serial(args.port, 115200, timeout=0.2)
    print("type left/right/up/down/center/stop/quit")
    while True:
        line = input("> ").strip().lower()
        if line in ("quit", "q"):
            ser.write(encode_stop().encode("ascii"))
            break
        if line in cmds:
            ser.write(cmds[line].encode("ascii"))
    ser.close()


if __name__ == "__main__":
    main()
