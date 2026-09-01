import { clamp } from "./math.ts";

export interface FrameSize {
  width: number;
  height: number;
}

export interface PixelPoint {
  x: number;
  y: number;
}

export interface NormalizedError {
  x: number;
  y: number;
  errorPxX: number;
  errorPxY: number;
  inDeadband: boolean;
}

/**
 * Convert a pixel target into a normalized error in [-1, 1].
 * Negative X = left of center, negative Y = above center.
 */
export function computeNormalizedError(
  target: PixelPoint,
  frame: FrameSize,
  deadband = 0,
): NormalizedError {
  const cx = frame.width / 2;
  const cy = frame.height / 2;
  const errorPxX = target.x - cx;
  const errorPxY = target.y - cy;
  const nx = clamp(errorPxX / (frame.width / 2), -1, 1);
  const ny = clamp(errorPxY / (frame.height / 2), -1, 1);
  const inDeadband = Math.abs(nx) < deadband && Math.abs(ny) < deadband;
  return { x: nx, y: ny, errorPxX, errorPxY, inDeadband };
}

export function applyDeadband(value: number, deadband: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.abs(value) < deadband ? 0 : value;
}

/**
 * Exponential smoothing. alpha closer to 1 = less lag, more noise.
 */
export function expSmooth(
  current: number,
  sample: number,
  alpha: number,
): number {
  const a = clamp(alpha, 0, 1);
  return a * sample + (1 - a) * current;
}

export function projectTarget(
  worldAz: number,
  worldEl: number,
  panDeg: number,
  tiltDeg: number,
  fovH: number,
  fovV: number,
  frame: FrameSize,
): { x: number; y: number; onFrame: boolean; nx: number; ny: number } {
  const errAz = worldAz - panDeg;
  const errEl = worldEl - tiltDeg;
  const nx = clamp(errAz / (fovH / 2), -1.4, 1.4);
  const ny = clamp(-errEl / (fovV / 2), -1.4, 1.4);
  const onFrame = Math.abs(nx) <= 1 && Math.abs(ny) <= 1;
  return {
    x: frame.width / 2 + nx * (frame.width / 2),
    y: frame.height / 2 + ny * (frame.height / 2),
    onFrame,
    nx: clamp(nx, -1, 1),
    ny: clamp(ny, -1, 1),
  };
}
