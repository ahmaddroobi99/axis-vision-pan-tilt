# STM32 firmware

Modules (do not dump everything into `main.c`):

```
firmware/
  App/         protocol, controller, safety
  Drivers/     motor STEP/DIR
  config/      hardware_config.h
```

`App/protocol_host.c` is a **host gcc** self-test of the XOR parser so the protocol can be verified without `arm-none-eabi-gcc`.

Device bring-up: CubeMX / STM32CubeIDE, USART1 115200, GPIO STEP/DIR/EN as in `hardware_config.h`, a 200 Hz (or faster) timer for the ramp.

Physical flash and motor motion: **not verified** in this repository.
