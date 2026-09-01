import { clamp } from "./math.ts";

export interface PidGains {
  kp: number;
  ki: number;
  kd: number;
}

export interface PidState {
  integral: number;
  prevError: number;
  initialized: boolean;
}

export function createPidState(): PidState {
  return { integral: 0, prevError: 0, initialized: false };
}

export interface PidUpdate {
  output: number;
  integral: number;
  prevError: number;
  p: number;
  i: number;
  d: number;
}

/**
 * PID with conditional anti-windup and output clamp of [-1, 1].
 * Output is a normalized command; callers scale by axis max speed.
 */
export function pidUpdate(
  error: number,
  dt: number,
  gains: PidGains,
  state: PidState,
  deadband = 0,
): PidUpdate {
  const e = Math.abs(error) < deadband ? 0 : error;
  const p = gains.kp * e;

  let d = 0;
  if (state.initialized && dt > 1e-6) {
    d = (gains.kd * (e - state.prevError)) / dt;
  }

  let integral = state.integral;
  const iGain = gains.ki;
  const tentativeI = integral + e * dt;
  const iTerm = iGain * tentativeI;
  let output = clamp(p + iTerm + d, -1, 1);

  const saturated = output === 1 || output === -1;
  const winding = Math.sign(e) === Math.sign(output);
  if (!(saturated && winding)) {
    integral = clamp(tentativeI, -2, 2);
  }
  const i = iGain * integral;
  output = clamp(p + i + d, -1, 1);

  return {
    output,
    integral,
    prevError: e,
    p,
    i,
    d,
  };
}

export function resetPid(state: PidState): PidState {
  return { integral: 0, prevError: 0, initialized: false };
}
