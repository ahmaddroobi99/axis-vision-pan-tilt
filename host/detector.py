"""Haar face detector with a synthetic fallback."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Detection:
    x: float
    y: float
    width: float
    height: float
    confidence: float
    class_name: str = "person"


class HaarDetector:
    def __init__(self, confidence=0.5):
        self.confidence = confidence
        self._cascade = None

    def _load(self):
        if self._cascade is not None:
            return
        import cv2

        path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self._cascade = cv2.CascadeClassifier(path)
        if self._cascade.empty():
            raise RuntimeError(f"failed to load cascade {path}")

    def detect(self, frame) -> list[Detection]:
        self._load()
        import cv2

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        boxes = self._cascade.detectMultiScale(gray, 1.1, 5, minSize=(48, 48))
        out = []
        for (x, y, w, h) in boxes:
            out.append(
                Detection(x=float(x), y=float(y), width=float(w), height=float(h),
                          confidence=max(self.confidence, 0.6), class_name="face")
            )
        return out


class SyntheticDetector:
    """Uses a known pixel target — for tests and --synthetic."""

    def __init__(self):
        self.target = (320.0, 240.0)

    def set_target(self, x, y):
        self.target = (float(x), float(y))

    def detect(self, frame) -> list[Detection]:
        x, y = self.target
        return [Detection(x=x - 44, y=y - 55, width=88, height=110, confidence=0.99)]
