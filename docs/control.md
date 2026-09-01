# Control

## Plant (software model)

Camera pan/tilt angles. Target has world azimuth/elevation. Image error is the angular difference divided by half the FOV, then clamped.

## Law

Default is **P** with a little **D**:

```
u = sat( Kp * e + Ki * integral + Kd * de/dt , ±1 )
v_des = u * max_speed
```

Anti-windup: do not integrate further when the output is saturated and the error would wind it more.

The motor never jumps to `max_speed`. Each MCU tick:

```
dv = clamp(v_des - v, ±accel * dt)
v += dv
θ += v * dt
```

Hard stops at `±pan_limit` / `±tilt_limit`.

## Why PID lives on the MCU

The host frame rate jitters. Step timing does not. The MCU runs the ramp even if the next `$T` is late; if it is *too* late, safety zeros the command.
