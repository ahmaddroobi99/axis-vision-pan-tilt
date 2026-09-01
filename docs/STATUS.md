# Project Status

Functional engineering MVP. Software of the loop is verified. Hardware is not.

## Software

- [x] Vision pipeline (synthetic + Haar interface)
- [x] Tracking / normalize / deadband / filter
- [x] P / PI / PID with anti-windup
- [x] UART protocol (encode, parse, checksum, reject)
- [x] Simulation / interactive console
- [x] Unit tests (protocol, tracker, controller, motor bounds)
- [x] Fake serial / synthetic camera

## Firmware

- [x] UART parser (host-compilable)
- [x] Controller
- [x] Motor abstraction (accel-limited)
- [x] Safety (timeout, E-stop, boot disabled)
- [ ] Physical validation on STM32 silicon

## Hardware

- [ ] Mechanical assembly
- [ ] Motor wiring
- [ ] TMC configuration
- [ ] Full tracking test with a person in the room

## Performance

Camera FPS, UART rate, and host-to-motor latency: **not measured** on hardware.
