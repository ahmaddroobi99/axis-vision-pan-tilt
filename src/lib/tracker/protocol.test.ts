import assert from "node:assert/strict";
import test from "node:test";
import {
  encodeHeartbeat,
  encodeStop,
  encodeTarget,
  parsePacket,
  xorChecksum,
} from "./protocol.ts";

test("checksum of example payload", () => {
  const payload = "T,0.125,-0.231,12345";
  const cs = xorChecksum(payload);
  const framed = encodeTarget(0.125, -0.231, 12345);
  assert.equal(framed.startsWith("$T,"), true);
  assert.equal(framed.endsWith("\r\n"), true);
  assert.equal(framed.includes(`*${cs}`), true);
});

test("roundtrip target packet", () => {
  const raw = encodeTarget(0.5, -0.25, 99);
  const r = parsePacket(raw);
  assert.equal(r.ok, true);
  assert.equal(r.packet?.kind, "T");
  if (r.packet?.kind === "T") {
    assert.ok(Math.abs(r.packet.x - 0.5) < 1e-6);
    assert.ok(Math.abs(r.packet.y + 0.25) < 1e-6);
    assert.equal(r.packet.timestamp, 99);
  }
});

test("rejects bad checksum", () => {
  const r = parsePacket("$T,0.1,0.1,1*00\r\n");
  assert.equal(r.ok, false);
});

test("rejects out of range", () => {
  const payload = "T,1.5,0.0,1";
  const raw = `$${payload}*${xorChecksum(payload)}\r\n`;
  const r = parsePacket(raw);
  assert.equal(r.ok, false);
});

test("stop and heartbeat", () => {
  assert.equal(parsePacket(encodeStop()).packet?.kind, "S");
  assert.equal(parsePacket(encodeHeartbeat()).packet?.kind, "H");
});

test("clamps encode to [-1, 1]", () => {
  const r = parsePacket(encodeTarget(5, -9, 0));
  assert.equal(r.ok, true);
  if (r.packet?.kind === "T") {
    assert.equal(r.packet.x, 1);
    assert.equal(r.packet.y, -1);
  }
});
