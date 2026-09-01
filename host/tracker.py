"""Normalized image error, deadband, exponential smoothing."""
from __future__ import annotations


def compute_normalized_error(tx, ty, width, height, deadband=0.0):
    cx, cy = width / 2.0, height / 2.0
    nx = max(-1.0, min(1.0, (tx - cx) / (width / 2.0)))
    ny = max(-1.0, min(1.0, (ty - cy) / (height / 2.0)))
    in_band = abs(nx) < deadband and abs(ny) < deadband
    return nx, ny, in_band


def exp_smooth(prev, sample, alpha):
    a = max(0.0, min(1.0, float(alpha)))
    return a * sample + (1.0 - a) * prev


def apply_deadband(value, deadband):
    return 0.0 if abs(value) < deadband else float(value)
