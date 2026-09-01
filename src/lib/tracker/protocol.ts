/**
 * ASCII UART protocol for the vision pan/tilt tracker.
 *
 *   $T,<x>,<y>,<timestamp>*CS\r\n
 *   $S*CS\r\n
 *   $H*CS\r\n
 *   $A,<0|1>*CS\r\n
 *   $E*CS\r\n   emergency stop
 *
 * Checksum is XOR of every byte between '$' and '*', rendered as two
 * uppercase hex digits.
 */

export type PacketKind = "T" | "S" | "H" | "A" | "E";

export interface TargetPacket {
  kind: "T";
  x: number;
  y: number;
  timestamp: number;
}

export interface StopPacket {
  kind: "S";
}

export interface HeartbeatPacket {
  kind: "H";
}

export interface AckPacket {
  kind: "A";
  ok: boolean;
}

export interface EstopPacket {
  kind: "E";
}

export type ParsedPacket =
  | TargetPacket
  | StopPacket
  | HeartbeatPacket
  | AckPacket
  | EstopPacket;

export interface ParseResult {
  ok: boolean;
  packet?: ParsedPacket;
  error?: string;
  raw: string;
}

export function xorChecksum(payload: string): string {
  let cs = 0;
  for (let i = 0; i < payload.length; i++) {
    cs ^= payload.charCodeAt(i) & 0xff;
  }
  return cs.toString(16).toUpperCase().padStart(2, "0");
}

export function frame(payload: string): string {
  return `$${payload}*${xorChecksum(payload)}\r\n`;
}

function clampNorm(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(-1, v));
}

export function encodeTarget(x: number, y: number, timestamp: number): string {
  const nx = clampNorm(x);
  const ny = clampNorm(y);
  const ts = Math.max(0, Math.floor(timestamp));
  return frame(`T,${nx.toFixed(3)},${ny.toFixed(3)},${ts}`);
}

export function encodeStop(): string {
  return frame("S");
}

export function encodeHeartbeat(): string {
  return frame("H");
}

export function encodeAck(ok: boolean): string {
  return frame(`A,${ok ? 1 : 0}`);
}

export function encodeEstop(): string {
  return frame("E");
}

function stripFrame(raw: string): { payload: string; cs: string } | null {
  const s = raw.replace(/\r?\n$/g, "");
  if (!s.startsWith("$") || !s.includes("*")) return null;
  const star = s.lastIndexOf("*");
  if (star <= 1) return null;
  return {
    payload: s.slice(1, star),
    cs: s.slice(star + 1).trim().toUpperCase(),
  };
}

export function parsePacket(raw: string): ParseResult {
  const trimmed = raw.replace(/^\u0000+/, "");
  const framed = stripFrame(trimmed);
  if (!framed) {
    return { ok: false, error: "missing frame ($…*)", raw };
  }
  const expected = xorChecksum(framed.payload);
  if (framed.cs !== expected) {
    return {
      ok: false,
      error: `checksum ${framed.cs} != ${expected}`,
      raw,
    };
  }

  const fields = framed.payload.split(",");
  const kind = fields[0];

  if (kind === "T") {
    if (fields.length !== 4) {
      return { ok: false, error: "T packet expects 3 fields", raw };
    }
    const x = Number(fields[1]);
    const y = Number(fields[2]);
    const timestamp = Number(fields[3]);
    if (![x, y, timestamp].every(Number.isFinite)) {
      return { ok: false, error: "non-numeric T fields", raw };
    }
    if (x < -1 || x > 1 || y < -1 || y > 1) {
      return { ok: false, error: "T values out of range [-1, 1]", raw };
    }
    return {
      ok: true,
      packet: { kind: "T", x, y, timestamp },
      raw,
    };
  }

  if (kind === "S") {
    return { ok: true, packet: { kind: "S" }, raw };
  }
  if (kind === "H") {
    return { ok: true, packet: { kind: "H" }, raw };
  }
  if (kind === "E") {
    return { ok: true, packet: { kind: "E" }, raw };
  }
  if (kind === "A") {
    if (fields.length < 2) {
      return { ok: false, error: "A packet missing status", raw };
    }
    return {
      ok: true,
      packet: { kind: "A", ok: fields[1] === "1" },
      raw,
    };
  }

  return { ok: false, error: `unknown type '${kind}'`, raw };
}

export function displayPacket(raw: string): string {
  return raw.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
}
