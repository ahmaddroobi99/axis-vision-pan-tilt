import assert from "node:assert/strict";
import test from "node:test";
import { createPidState, pidUpdate } from "./controller.ts";
import { applyDeadband, computeNormalizedError, expSmooth } from "./tracker.ts";
import { createMotor, stepMotor } from "./motor.ts";

test("center target yields zero error", () => {
  const e = computeNormalizedError({ x: 320, y: 240 }, { width: 640, height: 480 });
  assert.equal(e.x, 0);
  assert.equal(e.y, 0);
});

test("left of center is negative X", () => {
  const e = computeNormalizedError({ x: 0, y: 240 }, { width: 640, height: 480 });
  assert.equal(e.x, -1);
});

test("deadband zeros small values", () => {
  assert.equal(applyDeadband(0.03, 0.05), 0);
  assert.ok(applyDeadband(0.2, 0.05) !== 0);
});

test("exponential smoother lags toward sample", () => {
  const y = expSmooth(0, 1, 0.25);
  assert.equal(y, 0.25);
});

test("P controller is proportional", () => {
  const s = createPidState();
  const r = pidUpdate(0.5, 0.01, { kp: 2, ki: 0, kd: 0 }, s);
  assert.equal(r.output, 1);
});

test("motor never jumps to max speed", () => {
  let m = createMotor(0);
  m = { ...m, enabled: true, targetVel: 100 };
  m = stepMotor(m, 0.01, 80, 200, 90);
  assert.ok(m.currentVel < 80);
  assert.ok(m.currentVel > 0);
});

test("disabled motor stays at zero velocity", () => {
  let m = createMotor(10);
  m = { ...m, enabled: false, targetVel: 50 };
  m = stepMotor(m, 0.05, 80, 200, 90);
  assert.equal(m.currentVel, 0);
});
