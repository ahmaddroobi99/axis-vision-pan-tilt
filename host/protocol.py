"""ASCII UART framing for the pan/tilt tracker. $payload*CS\\r\\n"""
from __future__ import annotations


def xor_checksum(payload: str) -> str:
    cs = 0
    for ch in payload:
        cs ^= ord(ch) & 0xFF
    return f"{cs:02X}"


def frame(payload: str) -> str:
    return f"${payload}*{xor_checksum(payload)}\r\n"


def encode_target(x: float, y: float, timestamp: int) -> str:
    x = max(-1.0, min(1.0, float(x)))
    y = max(-1.0, min(1.0, float(y)))
    return frame(f"T,{x:.3f},{y:.3f},{int(timestamp)}")


def encode_stop() -> str:
    return frame("S")


def encode_heartbeat() -> str:
    return frame("H")


def encode_estop() -> str:
    return frame("E")


def parse_packet(raw: str) -> dict:
    s = raw.strip()
    if not s.startswith("$") or "*" not in s:
        raise ValueError("missing frame")
    payload, cs = s[1:].rsplit("*", 1)
    if xor_checksum(payload) != cs.upper():
        raise ValueError("bad checksum")
    fields = payload.split(",")
    kind = fields[0]
    if kind == "T":
        x, y, ts = float(fields[1]), float(fields[2]), int(float(fields[3]))
        if not (-1.0 <= x <= 1.0 and -1.0 <= y <= 1.0):
            raise ValueError("out of range")
        return {"kind": "T", "x": x, "y": y, "timestamp": ts}
    if kind in {"S", "H", "E"}:
        return {"kind": kind}
    if kind == "A":
        return {"kind": "A", "ok": fields[1] == "1"}
    raise ValueError("unknown type")
