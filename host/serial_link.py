"""Real pyserial link or an in-memory fake for --simulation."""
from __future__ import annotations

from collections import deque


class SerialLink:
    def __init__(self, port: str, baudrate: int = 115200, timeout: float = 0.1):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self._ser = None

    def open(self):
        import serial

        self._ser = serial.Serial(self.port, self.baudrate, timeout=self.timeout)
        return self

    def write(self, packet: str):
        if self._ser is None:
            raise RuntimeError("serial closed")
        self._ser.write(packet.encode("ascii"))

    def close(self):
        if self._ser is not None:
            self._ser.close()
            self._ser = None


class FakeSerial:
    """Records TX packets. Optionally echoes ACKs."""

    def __init__(self):
        self.tx = deque(maxlen=256)
        self.connected = True

    def write(self, packet: str):
        self.tx.append(packet)

    def last(self) -> str | None:
        return self.tx[-1] if self.tx else None

    def close(self):
        self.connected = False
