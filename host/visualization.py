"""OpenCV overlay: box, reticle, X/Y, FPS."""
from __future__ import annotations


def draw_overlay(frame, detection, nx, ny, fps, uart_ok, debug=False):
    import cv2

    h, w = frame.shape[:2]
    cx, cy = w // 2, h // 2
    cv2.drawMarker(frame, (cx, cy), (200, 205, 196), cv2.MARKER_CROSS, 16, 1)
    if detection is not None:
        x, y, bw, bh = (int(detection.x), int(detection.y), int(detection.width), int(detection.height))
        color = (138, 163, 138)
        cv2.rectangle(frame, (x, y), (x + bw, y + bh), color, 1)
        cv2.circle(frame, (x + bw // 2, y + bh // 2), 3, color, -1)
        if debug:
            cv2.line(frame, (cx, cy), (x + bw // 2, y + bh // 2), (180, 180, 170), 1)
    status = "LOCK" if detection is not None else "LOST"
    cv2.putText(frame, f"X {nx:+.3f}  Y {ny:+.3f}  {status}  {fps:.0f} FPS",
                (12, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (236, 236, 232), 1, cv2.LINE_AA)
    cv2.putText(frame, "UART " + ("UP" if uart_ok else "DOWN"),
                (12, 44), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (154, 155, 150), 1, cv2.LINE_AA)
    return frame
