# Tuning

Work on a **soft** surface with current low enough that a stall is obvious, not violent.

## Procedure

1. `Ki = 0`, `Kd = 0`.
2. Raise `Kp` until a slow-moving subject is followed.
3. If the camera rings around the face, **drop Kp**.
4. Add a little `Kd` only if overshoot remains.
5. Add `Ki` only if a constant offset remains **after** the deadband (rare for this plant).
6. If steps skip, the problem is **acceleration, current, or mechanics**, not Kp.

Host filter:

- `filter_alpha` closer to 1 = snappier, noisier.
- `deadband` ~ 0.04–0.08 stops hunting on a still face.

Motor:

- Raise `acceleration` only after current is enough to hold the camera.
- Pan usually wants a higher max speed than tilt.

## Symptoms

| You see | It is | Do this |
| --- | --- | --- |
| Box jitters, motors buzz | Noise | Lower alpha, raise deadband |
| Overshoot / oscillation | Too much Kp, not enough damping | Drop Kp, add Kd |
| Always late | Too little Kp or max speed | Raise Kp / speed |
| Missed steps, growl | Accel or current | Lower accel, raise TMC current slightly |
| Lost target, keeps spinning | Timeout too long / bug | Confirm `$S` on loss; 300 ms default |
| Face centered, still creeping | Deadband too small or Ki windup | Raise deadband, keep Ki = 0 |

## Axis invert

If left/right is wrong after jog, invert pan DIR. If up/down is wrong, invert tilt DIR. Image Y is positive **down**.
