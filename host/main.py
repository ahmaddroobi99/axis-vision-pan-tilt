"""Host entry: camera → detect → error → UART.

python -m host.main --simulation
python -m host.main --synthetic
python -m host.main --debug
"""
from __future__ import annotations

import argparse
import math
import sys
import time

from host.config import load_config
from host.controller import PID
from host.detector import HaarDetector, SyntheticDetector
from host.protocol import encode_stop, encode_target
from host.serial_link import FakeSerial, SerialLink
from host.tracker import apply_deadband, compute_normalized_error, exp_smooth


def parse_args():
    p = argparse.ArgumentParser(description="AXIS vision pan/tilt host")
    p.add_argument("--simulation", action="store_true", help="fake serial, no MCU")
    p.add_argument("--synthetic", action="store_true", help="no camera, moving blob")
    p.add_argument("--debug", action="store_true")
    p.add_argument("--config", default=None)
    return p.parse_args()


def main():
    args = parse_args()
    cfg = load_config(args.config)
    cam_w = cfg["camera"]["width"]
    cam_h = cfg["camera"]["height"]
    alpha = cfg["tracking"]["filter_alpha"]
    dead = cfg["tracking"]["deadband"]
    timeout_ms = cfg["tracking"]["target_timeout_ms"]

    if args.synthetic or args.simulation:
        detector = SyntheticDetector()
        camera = None
    else:
        from host.camera import Camera

        camera = Camera(cfg["camera"]["index"], cam_w, cam_h, cfg["camera"]["fps"])
        try:
            camera.open()
        except Exception as exc:
            print(f"camera failed ({exc}); use --synthetic", file=sys.stderr)
            sys.exit(1)
        detector = HaarDetector(cfg["detector"]["confidence"])

    link = FakeSerial() if args.simulation or args.synthetic else SerialLink(
        cfg["uart"]["port"], cfg["uart"]["baudrate"], cfg["uart"]["timeout"]
    )
    if hasattr(link, "open") and not args.simulation:
        try:
            link.open()
        except Exception as exc:
            print(f"serial failed ({exc}); falling back to fake", file=sys.stderr)
            link = FakeSerial()

    fx = fy = 0.0
    last_seen = time.time()
    t0 = time.time()
    frames = 0
    pid = PID(cfg["pan"]["kp"], cfg["pan"]["ki"], cfg["pan"]["kd"])

    try:
        while True:
            now = time.time()
            if args.synthetic or args.simulation:
                tx = cam_w / 2 + math.sin(now * 0.7) * cam_w * 0.28
                ty = cam_h / 2 + math.cos(now * 0.45) * cam_h * 0.18
                detector.set_target(tx, ty)
                from host.camera import synthetic_frame

                frame = synthetic_frame(cam_w, cam_h, tx, ty)
            else:
                frame = camera.read()

            dets = detector.detect(frame)
            if dets:
                d = max(dets, key=lambda x: x.width * x.height)
                last_seen = now
                cx = d.x + d.width / 2
                cy = d.y + d.height / 2
                nx, ny, _ = compute_normalized_error(cx, cy, cam_w, cam_h, dead)
                fx = exp_smooth(fx, nx, alpha)
                fy = exp_smooth(fy, ny, alpha)
                sx = apply_deadband(fx, dead)
                sy = apply_deadband(fy, dead)
                pkt = encode_target(sx, sy, int((now - t0) * 1000))
            else:
                pkt = encode_stop()
                d = None
                sx = sy = 0.0

            if (now - last_seen) * 1000 > timeout_ms:
                pkt = encode_stop()

            link.write(pkt)
            frames += 1
            fps = frames / max(1e-3, now - t0)
            if args.debug or args.synthetic or args.simulation:
                from host.visualization import draw_overlay

                vis = draw_overlay(frame, d if dets else None, sx, sy, fps, True, args.debug)
                try:
                    import cv2

                    cv2.imshow("AXIS", vis)
                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        break
                except Exception:
                    if frames % 30 == 0:
                        print(pkt.strip(), f"fps={fps:.1f}")
            time.sleep(1.0 / max(1, cfg["camera"]["fps"]))
    finally:
        if camera is not None:
            camera.release()
        link.close()
        pid.reset()


if __name__ == "__main__":
    main()
