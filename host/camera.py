"""USB camera wrapper. Synthetic frames when no device is present."""
from __future__ import annotations

import numpy as np


class Camera:
    def __init__(self, index=0, width=640, height=480, fps=30):
        self.index = index
        self.width = width
        self.height = height
        self.fps = fps
        self._cap = None

    def open(self):
        try:
            import cv2
        except ImportError as exc:
            raise RuntimeError("opencv-python is required for a real camera") from exc
        cap = cv2.VideoCapture(self.index)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        cap.set(cv2.CAP_PROP_FPS, self.fps)
        if not cap.isOpened():
            cap.release()
            raise RuntimeError(f"camera index {self.index} failed to open")
        self._cap = cap
        return self

    def read(self):
        if self._cap is None:
            raise RuntimeError("camera is closed")
        ok, frame = self._cap.read()
        if not ok:
            raise RuntimeError("frame grab failed")
        return frame

    def release(self):
        if self._cap is not None:
            self._cap.release()
            self._cap = None


def synthetic_frame(width, height, tx, ty):
    """Dark room + a light blob at (tx, ty) pixel coordinates."""
    img = np.zeros((height, width, 3), dtype=np.uint8)
    img[:] = (18, 20, 24)
    x, y = int(tx), int(ty)
    yy, xx = np.ogrid[:height, :width]
    blob = (xx - x) ** 2 / 1800 + (yy - y) ** 2 / 2400
    mask = blob < 1
    img[mask] = (210, 214, 200)
    return img
