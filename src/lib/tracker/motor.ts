import { clamp } from "./math.ts";

export interface MotorAxis {
  positionDeg: number;
  currentVel: number;
  targetVel: number;
  enabled: boolean;
}

export function createMotor(positionDeg = 0): MotorAxis {
  return {
    positionDeg,
    currentVel: 0,
    targetVel: 0,
    enabled: false,
  };
}

/**
 * First-order acceleration-limited velocity ramp, then integrate position.
 * Speeds are in deg/s. Never jumps to max speed.
 */
export function stepMotor(
  axis: MotorAxis,
  dt: number,
  maxSpeed: number,
  acceleration: number,
  limitDeg: number,
): MotorAxis {
  if (!axis.enabled) {
    return {
      ...axis,
      currentVel: 0,
      targetVel: 0,
    };
  }

  const target = clamp(axis.targetVel, -maxSpeed, maxSpeed);
  const maxDv = Math.max(0, acceleration) * dt;
  const dv = clamp(target - axis.currentVel, -maxDv, maxDv);
  let vel = axis.currentVel + dv;
  vel = clamp(vel, -maxSpeed, maxSpeed);

  let pos = axis.positionDeg + vel * dt;
  if (pos > limitDeg) {
    pos = limitDeg;
    vel = Math.min(0, vel);
  } else if (pos < -limitDeg) {
    pos = -limitDeg;
    vel = Math.max(0, vel);
  }

  return {
    ...axis,
    positionDeg: pos,
    currentVel: vel,
    targetVel: target,
  };
}

export function disableMotor(axis: MotorAxis): MotorAxis {
  return { ...axis, enabled: false, currentVel: 0, targetVel: 0 };
}

export function enableMotor(axis: MotorAxis): MotorAxis {
  return { ...axis, enabled: true };
}
