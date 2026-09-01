# Architecture

AXIS splits **perception** (host) from **actuation** (STM32). The computer never drives coils. It publishes a normalized image error. The MCU owns velocity, acceleration, enable, and every timeout.

## Block diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ HOST (Python / TypeScript)                                      │
│  Camera → Detector → Tracker → Filter → Controller → Serial     │
│                         config.yaml                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │ UART 115200 8N1
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ STM32                                                           │
│  UART RX → Protocol → PID → Motor ramp → Safety                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │ STEP / DIR / EN
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ TMC2208/2209  ×2  →  Pan stepper + Tilt stepper                 │
│ Camera is mounted on the tilt platform, which sits on pan.      │
└─────────────────────────────────────────────────────────────────┘
```

## Data flow

1. Frame in (640×480 @ ~30 FPS).
2. Detector returns a bounding box (Haar face, synthetic, or optional YOLO).
3. Target center `(tx, ty)` versus image center `(cx, cy)`.
4. `ex = (tx-cx)/(w/2)`, `ey = (ty-cy)/(h/2)`, clamped to `[-1, 1]`.
5. Exponential smooth (`alpha`) then deadband.
6. `$T,ex,ey,timestamp*CS` on UART.
7. STM32 validates, runs PID, ramps velocity, emits STEP/DIR.
8. Mechanism moves the camera. Next frame is the feedback.

## Modules

### Host

| File | Purpose | In | Out |
| --- | --- | --- | --- |
| `host/camera.py` | Capture | device index | BGR frame |
| `host/detector.py` | Find target | frame | list of detections |
| `host/tracker.py` | Error | box + frame size | `ex, ey` |
| `host/controller.py` | Optional host P/PID | error | command |
| `host/protocol.py` | Framing | numbers | ASCII packet |
| `host/serial_link.py` | UART or fake serial | packet | bytes |

### Firmware

| File | Purpose |
| --- | --- |
| `firmware/App/protocol.c` | Frame, checksum, reject |
| `firmware/App/controller.c` | PID + anti-windup |
| `firmware/Drivers/motor.c` | Accel-limited STEP/DIR |
| `firmware/App/safety.c` | Timeouts, E-stop, enable |
| `firmware/config/hardware_config.h` | Pins, baud, limits |

### Interactive console

`src/lib/tracker/` is a TypeScript port of the same math, used by the live preview so the loop can be demonstrated without a bench.

## Timing (nominal, not measured on hardware)

| Path | Rate |
| --- | --- |
| Host vision | 30 Hz |
| UART | 115200 baud, ~3 ms for a T packet |
| STM32 control | 200 Hz in the model (100–1000 Hz is the firmware target) |

Physical camera-to-motor latency: **not measured**.

Full drawing set: [diagrams.md](diagrams.md). Control law: [control.md](control.md). UART: [uart_protocol.md](uart_protocol.md). Wiring: [wiring.md](wiring.md).
