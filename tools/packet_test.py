#!/usr/bin/env python3
"""Generate and parse example UART packets."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from host.protocol import (
    encode_estop,
    encode_heartbeat,
    encode_stop,
    encode_target,
    parse_packet,
    xor_checksum,
)


def show(raw: str):
    print("TX ", raw.replace("\r", "\\r").replace("\n", "\\n"))
    print("   ", parse_packet(raw))


def main():
    show(encode_target(0.125, -0.231, 12345))
    show(encode_stop())
    show(encode_heartbeat())
    show(encode_estop())
    bad = "$T,0.1,0.1,1*00\r\n"
    try:
        parse_packet(bad)
        raise SystemExit("bad checksum should fail")
    except ValueError as exc:
        print("REJECT", bad.strip(), exc)
    payload = "T,0.125,-0.231,12345"
    print("XOR", payload, xor_checksum(payload))


if __name__ == "__main__":
    main()
