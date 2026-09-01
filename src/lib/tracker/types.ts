export type TargetMode = "patrol" | "figure8" | "drag" | "still" | "webcam";

export type FirmwareState =
  | "IDLE"
  | "TRACKING"
  | "SAFE_STOP"
  | "ESTOP"
  | "HEARTBEAT";

export type DetectorKind = "haar" | "synthetic" | "webcam";

export interface AxisGains {
  kp: number;
  ki: number;
  kd: number;
  maxSpeed: number;
  acceleration: number;
  deadband: number;
}

export interface TrackerConfig {
  camera: {
    width: number;
    height: number;
    fps: number;
    fovH: number;
    fovV: number;
  };
  tracking: {
    filterAlpha: number;
    deadband: number;
    targetTimeoutMs: number;
  };
  uart: {
    baud: number;
    timeoutMs: number;
  };
  pan: AxisGains;
  tilt: AxisGains;
  motor: {
    stepsPerRev: number;
    microstepping: number;
    panLimitDeg: number;
    tiltLimitDeg: number;
  };
}

export interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  className: string;
}

export interface PacketRecord {
  id: number;
  t: number;
  raw: string;
  kind: "T" | "S" | "H" | "A" | "E" | "?";
  ok: boolean;
  note: string;
}

export interface AxisState {
  positionDeg: number;
  currentVel: number;
  targetVel: number;
  enabled: boolean;
  integral: number;
  prevError: number;
}

export interface SimSnapshot {
  time: number;
  dt: number;
  running: boolean;
  trackingEnabled: boolean;
  estop: boolean;
  mode: TargetMode;
  worldAz: number;
  worldEl: number;
  detected: boolean;
  confidence: number;
  targetAgeMs: number;
  rawX: number;
  rawY: number;
  filteredX: number;
  filteredY: number;
  hostX: number;
  hostY: number;
  fps: number;
  hostHz: number;
  mcuHz: number;
  uartConnected: boolean;
  lastPacketAgeMs: number;
  firmwareState: FirmwareState;
  pan: AxisState;
  tilt: AxisState;
  packets: PacketRecord[];
  latencyMs: number;
  stepsPan: number;
  stepsTilt: number;
  detection: Detection | null;
}

export const DEFAULT_CONFIG: TrackerConfig = {
  camera: { width: 640, height: 480, fps: 30, fovH: 60, fovV: 45 },
  tracking: { filterAlpha: 0.25, deadband: 0.05, targetTimeoutMs: 300 },
  uart: { baud: 115200, timeoutMs: 300 },
  pan: {
    kp: 1.15,
    ki: 0,
    kd: 0.08,
    maxSpeed: 70,
    acceleration: 220,
    deadband: 0.04,
  },
  tilt: {
    kp: 1.05,
    ki: 0,
    kd: 0.1,
    maxSpeed: 50,
    acceleration: 180,
    deadband: 0.04,
  },
  motor: {
    stepsPerRev: 400,
    microstepping: 16,
    panLimitDeg: 85,
    tiltLimitDeg: 40,
  },
};
