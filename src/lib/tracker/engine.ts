import { clamp, wrapDegrees } from "./math.ts";
import { pidUpdate, type PidState } from "./controller";
import { createMotor, disableMotor, enableMotor, stepMotor, type MotorAxis } from "./motor";
import {
  encodeEstop,
  encodeHeartbeat,
  encodeStop,
  encodeTarget,
  parsePacket,
  type ParsedPacket,
} from "./protocol";
import { applyDeadband, expSmooth, projectTarget } from "./tracker";
import {
  DEFAULT_CONFIG,
  type FirmwareState,
  type PacketRecord,
  type SimSnapshot,
  type TargetMode,
  type TrackerConfig,
} from "./types";

const HOST_DT = 1 / 30;
const MCU_DT = 1 / 200;
const UART_DELAY = 0.003;
const MAX_PACKETS = 36;

interface Inflight {
  deliverAt: number;
  raw: string;
}

export interface EngineInput {
  running: boolean;
  trackingEnabled: boolean;
  estop: boolean;
  mode: TargetMode;
  dragAz?: number;
  dragEl?: number;
  webcamNx?: number | null;
  webcamNy?: number | null;
  webcamPresent?: boolean;
  inject?: "left" | "right" | "up" | "down" | "center" | "stop" | "heartbeat" | null;
}

interface EngineState {
  time: number;
  hostAcc: number;
  mcuAcc: number;
  worldAz: number;
  worldEl: number;
  filteredX: number;
  filteredY: number;
  hostX: number;
  hostY: number;
  rawX: number;
  rawY: number;
  detected: boolean;
  confidence: number;
  targetAgeMs: number;
  lastPacketAgeMs: number;
  uartConnected: boolean;
  firmwareState: FirmwareState;
  pan: MotorAxis;
  tilt: MotorAxis;
  panPid: PidState;
  tiltPid: PidState;
  packets: PacketRecord[];
  inflight: Inflight[];
  packetId: number;
  fpsEma: number;
  hostTicks: number;
  mcuTicks: number;
  lastHostT: number;
  lastMcuT: number;
  hostHz: number;
  mcuHz: number;
  latencyMs: number;
  stepsPan: number;
  stepsTilt: number;
  lastErrorX: number;
  lastErrorY: number;
  pendingInject: EngineInput["inject"];
}

export function createEngineState(): EngineState {
  return {
    time: 0,
    hostAcc: 0,
    mcuAcc: 0,
    worldAz: 18,
    worldEl: 6,
    filteredX: 0,
    filteredY: 0,
    hostX: 0,
    hostY: 0,
    rawX: 0,
    rawY: 0,
    detected: true,
    confidence: 0.92,
    targetAgeMs: 0,
    lastPacketAgeMs: 1e6,
    uartConnected: false,
    firmwareState: "IDLE",
    pan: createMotor(0),
    tilt: createMotor(0),
    panPid: { integral: 0, prevError: 0, initialized: false },
    tiltPid: { integral: 0, prevError: 0, initialized: false },
    packets: [],
    inflight: [],
    packetId: 0,
    fpsEma: 30,
    hostTicks: 0,
    mcuTicks: 0,
    lastHostT: 0,
    lastMcuT: 0,
    hostHz: 30,
    mcuHz: 200,
    latencyMs: 0,
    stepsPan: 0,
    stepsTilt: 0,
    lastErrorX: 0,
    lastErrorY: 0,
    pendingInject: null,
  };
}

function pushPacket(state: EngineState, raw: string, ok: boolean, note: string) {
  const kindChar = raw[1] as PacketRecord["kind"];
  const rec: PacketRecord = {
    id: state.packetId++,
    t: state.time,
    raw,
    kind: ["T", "S", "H", "A", "E"].includes(kindChar) ? kindChar : "?",
    ok,
    note,
  };
  state.packets = [rec, ...state.packets].slice(0, MAX_PACKETS);
}

function queueTx(state: EngineState, raw: string) {
  state.inflight.push({ deliverAt: state.time + UART_DELAY, raw });
}

function moveTarget(state: EngineState, dt: number, input: EngineInput) {
  const t = state.time;
  if (input.mode === "still") {
    return;
  }
  if (input.mode === "drag") {
    if (input.dragAz !== undefined) state.worldAz = input.dragAz;
    if (input.dragEl !== undefined) state.worldEl = input.dragEl;
    return;
  }
  if (input.mode === "webcam") {
    return;
  }
  if (input.mode === "figure8") {
    state.worldAz = 26 * Math.sin(t * 0.55);
    state.worldEl = 12 * Math.sin(t * 1.1);
    return;
  }
  // patrol — slow orbit with a slight pause
  state.worldAz = 22 * Math.sin(t * 0.42);
  state.worldEl = 9 * Math.cos(t * 0.31);
}

function hostTick(state: EngineState, cfg: TrackerConfig, input: EngineInput) {
  const frame = { width: cfg.camera.width, height: cfg.camera.height };
  const proj = projectTarget(
    state.worldAz,
    state.worldEl,
    state.pan.positionDeg,
    state.tilt.positionDeg,
    cfg.camera.fovH,
    cfg.camera.fovV,
    frame,
  );

  let detected = proj.onFrame;
  let nx = proj.nx;
  let ny = proj.ny;
  let confidence = detected ? 0.86 + 0.12 * (1 - Math.hypot(nx, ny) * 0.4) : 0;

  if (input.mode === "webcam") {
    if (input.webcamPresent && input.webcamNx != null && input.webcamNy != null) {
      detected = true;
      nx = clamp(input.webcamNx, -1, 1);
      ny = clamp(input.webcamNy, -1, 1);
      confidence = 0.9;
    } else {
      detected = false;
      confidence = 0;
    }
  }

  state.detected = detected;
  state.confidence = confidence;
  state.rawX = detected ? nx : 0;
  state.rawY = detected ? ny : 0;

  if (detected) {
    state.targetAgeMs = 0;
    state.filteredX = expSmooth(state.filteredX, nx, cfg.tracking.filterAlpha);
    state.filteredY = expSmooth(state.filteredY, ny, cfg.tracking.filterAlpha);
  } else {
    state.targetAgeMs += HOST_DT * 1000;
  }

  const lost = !detected || state.targetAgeMs > cfg.tracking.targetTimeoutMs;
  const sendX = applyDeadband(state.filteredX, cfg.tracking.deadband);
  const sendY = applyDeadband(state.filteredY, cfg.tracking.deadband);
  state.hostX = lost ? 0 : sendX;
  state.hostY = lost ? 0 : sendY;

  if (!input.running || input.estop) {
    if (input.estop) queueTx(state, encodeEstop());
    else queueTx(state, encodeStop());
    return;
  }

  if (!input.trackingEnabled) {
    queueTx(state, encodeStop());
    return;
  }

  if (lost) {
    queueTx(state, encodeStop());
    return;
  }

  const raw = encodeTarget(sendX, sendY, Math.floor(state.time * 1000));
  queueTx(state, raw);
}

function applyPacket(state: EngineState, cfg: TrackerConfig, packet: ParsedPacket) {
  state.lastPacketAgeMs = 0;
  state.uartConnected = true;

  if (packet.kind === "E") {
    state.firmwareState = "ESTOP";
    state.pan = disableMotor(state.pan);
    state.tilt = disableMotor(state.tilt);
    state.panPid = { integral: 0, prevError: 0, initialized: false };
    state.tiltPid = { integral: 0, prevError: 0, initialized: false };
    return;
  }

  if (state.firmwareState === "ESTOP") return;

  if (packet.kind === "S") {
    state.firmwareState = "SAFE_STOP";
    state.pan.targetVel = 0;
    state.tilt.targetVel = 0;
    return;
  }

  if (packet.kind === "H") {
    if (state.firmwareState !== "TRACKING") state.firmwareState = "HEARTBEAT";
    return;
  }

  if (packet.kind === "T") {
    state.firmwareState = "TRACKING";
    state.pan = enableMotor(state.pan);
    state.tilt = enableMotor(state.tilt);
    state.lastErrorX = packet.x;
    state.lastErrorY = packet.y;

    const panOut = pidUpdate(packet.x, MCU_DT, cfg.pan, state.panPid, cfg.pan.deadband);
    const tiltOut = pidUpdate(
      -packet.y,
      MCU_DT,
      cfg.tilt,
      state.tiltPid,
      cfg.tilt.deadband,
    );
    state.panPid = {
      integral: panOut.integral,
      prevError: panOut.prevError,
      initialized: true,
    };
    state.tiltPid = {
      integral: tiltOut.integral,
      prevError: tiltOut.prevError,
      initialized: true,
    };
    state.pan.targetVel = panOut.output * cfg.pan.maxSpeed;
    state.tilt.targetVel = tiltOut.output * cfg.tilt.maxSpeed;
  }
}

function mcuTick(state: EngineState, cfg: TrackerConfig) {
  state.lastPacketAgeMs += MCU_DT * 1000;

  const due = state.inflight.filter((p) => p.deliverAt <= state.time);
  state.inflight = state.inflight.filter((p) => p.deliverAt > state.time);
  for (const msg of due) {
    const parsed = parsePacket(msg.raw);
    pushPacket(
      state,
      msg.raw.trim(),
      parsed.ok,
      parsed.ok ? parsed.packet?.kind ?? "ok" : parsed.error ?? "reject",
    );
    if (parsed.ok && parsed.packet) {
      state.latencyMs = UART_DELAY * 1000 + 2;
      applyPacket(state, cfg, parsed.packet);
    }
  }

  if (state.firmwareState === "ESTOP") {
    state.pan = disableMotor(state.pan);
    state.tilt = disableMotor(state.tilt);
    return;
  }

  if (state.lastPacketAgeMs > cfg.uart.timeoutMs) {
    if (state.firmwareState === "TRACKING" || state.firmwareState === "HEARTBEAT") {
      state.firmwareState = "SAFE_STOP";
    }
    state.pan.targetVel = 0;
    state.tilt.targetVel = 0;
    if (state.lastPacketAgeMs > cfg.uart.timeoutMs * 4) {
      state.uartConnected = false;
      state.firmwareState = "IDLE";
      state.pan = disableMotor(state.pan);
      state.tilt = disableMotor(state.tilt);
    }
  }

  const prevPan = state.pan.positionDeg;
  const prevTilt = state.tilt.positionDeg;
  state.pan = stepMotor(
    state.pan,
    MCU_DT,
    cfg.pan.maxSpeed,
    cfg.pan.acceleration,
    cfg.motor.panLimitDeg,
  );
  state.tilt = stepMotor(
    state.tilt,
    MCU_DT,
    cfg.tilt.maxSpeed,
    cfg.tilt.acceleration,
    cfg.motor.tiltLimitDeg,
  );

  const stepsPerDeg =
    (cfg.motor.stepsPerRev * cfg.motor.microstepping) / 360;
  state.stepsPan += Math.abs(state.pan.positionDeg - prevPan) * stepsPerDeg;
  state.stepsTilt += Math.abs(state.tilt.positionDeg - prevTilt) * stepsPerDeg;
}

function handleInject(state: EngineState, input: EngineInput) {
  const cmd = input.inject ?? state.pendingInject;
  if (!cmd) return;
  state.pendingInject = null;
  if (cmd === "stop") queueTx(state, encodeStop());
  else if (cmd === "heartbeat") queueTx(state, encodeHeartbeat());
  else if (cmd === "left") queueTx(state, encodeTarget(-0.55, 0, Math.floor(state.time * 1000)));
  else if (cmd === "right") queueTx(state, encodeTarget(0.55, 0, Math.floor(state.time * 1000)));
  else if (cmd === "up") queueTx(state, encodeTarget(0, -0.45, Math.floor(state.time * 1000)));
  else if (cmd === "down") queueTx(state, encodeTarget(0, 0.45, Math.floor(state.time * 1000)));
  else if (cmd === "center") queueTx(state, encodeTarget(0, 0, Math.floor(state.time * 1000)));
}

export function stepEngine(
  state: EngineState,
  dtRaw: number,
  cfg: TrackerConfig,
  input: EngineInput,
): EngineState {
  const dt = Math.min(dtRaw, 0.08);
  const next: EngineState = { ...state, packets: state.packets, inflight: [...state.inflight] };

  if (input.estop && next.firmwareState !== "ESTOP") {
    queueTx(next, encodeEstop());
  }

  if (!input.running) {
    next.fpsEma = 0;
    return snapshotMotors(next, cfg, input, dt);
  }

  next.time += dt;
  next.hostAcc += dt;
  next.mcuAcc += dt;
  next.fpsEma = next.fpsEma * 0.9 + (1 / Math.max(dt, 1 / 240)) * 0.1;

  moveTarget(next, dt, input);
  next.worldAz = wrapDegrees(clamp(next.worldAz, -80, 80));
  next.worldEl = clamp(next.worldEl, -35, 35);

  handleInject(next, input);

  while (next.hostAcc >= HOST_DT) {
    next.hostAcc -= HOST_DT;
    hostTick(next, cfg, input);
    next.hostTicks += 1;
    if (next.time > next.lastHostT) {
      next.hostHz = 1 / Math.max(HOST_DT, next.time - next.lastHostT);
      next.lastHostT = next.time;
    }
  }

  while (next.mcuAcc >= MCU_DT) {
    next.mcuAcc -= MCU_DT;
    mcuTick(next, cfg);
    next.mcuTicks += 1;
    next.lastMcuT = next.time;
    next.mcuHz = 1 / MCU_DT;
  }

  return next;
}

function snapshotMotors(
  state: EngineState,
  cfg: TrackerConfig,
  input: EngineInput,
  dt: number,
): EngineState {
  if (!input.running) {
    state.pan = { ...state.pan, currentVel: 0, targetVel: 0 };
    state.tilt = { ...state.tilt, currentVel: 0, targetVel: 0 };
  }
  void cfg;
  void dt;
  return state;
}

export function toSnapshot(
  state: EngineState,
  cfg: TrackerConfig,
  input: EngineInput,
): SimSnapshot {
  const frame = { width: cfg.camera.width, height: cfg.camera.height };
  const proj = projectTarget(
    state.worldAz,
    state.worldEl,
    state.pan.positionDeg,
    state.tilt.positionDeg,
    cfg.camera.fovH,
    cfg.camera.fovV,
    frame,
  );

  const boxW = 88;
  const boxH = 110;
  const detection =
    state.detected && proj.onFrame
      ? {
          x: proj.x - boxW / 2,
          y: proj.y - boxH / 2,
          width: boxW,
          height: boxH,
          confidence: state.confidence,
          className: "person",
        }
      : null;

  return {
    time: state.time,
    dt: 0,
    running: input.running,
    trackingEnabled: input.trackingEnabled,
    estop: input.estop,
    mode: input.mode,
    worldAz: state.worldAz,
    worldEl: state.worldEl,
    detected: state.detected && (input.mode === "webcam" ? !!input.webcamPresent : proj.onFrame),
    confidence: state.confidence,
    targetAgeMs: state.targetAgeMs,
    rawX: state.rawX,
    rawY: state.rawY,
    filteredX: state.filteredX,
    filteredY: state.filteredY,
    hostX: state.hostX,
    hostY: state.hostY,
    fps: state.fpsEma,
    hostHz: 30,
    mcuHz: 200,
    uartConnected: state.uartConnected && state.lastPacketAgeMs < cfg.uart.timeoutMs * 2,
    lastPacketAgeMs: state.lastPacketAgeMs,
    firmwareState: state.firmwareState,
    pan: {
      positionDeg: state.pan.positionDeg,
      currentVel: state.pan.currentVel,
      targetVel: state.pan.targetVel,
      enabled: state.pan.enabled,
      integral: state.panPid.integral,
      prevError: state.panPid.prevError,
    },
    tilt: {
      positionDeg: state.tilt.positionDeg,
      currentVel: state.tilt.currentVel,
      targetVel: state.tilt.targetVel,
      enabled: state.tilt.enabled,
      integral: state.tiltPid.integral,
      prevError: state.tiltPid.prevError,
    },
    packets: state.packets,
    latencyMs: state.latencyMs,
    stepsPan: state.stepsPan,
    stepsTilt: state.stepsTilt,
    detection,
  };
}

export { DEFAULT_CONFIG };
