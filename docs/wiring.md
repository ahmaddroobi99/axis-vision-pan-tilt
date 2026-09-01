# Wiring

**Common ground is required.** Logic 3.3 V. Motor VM 12–24 V on a **separate** supply.

## Pin map (defaults, all configurable)

| Signal | STM32 | Driver / host |
| --- | --- | --- |
| PAN_STEP | PA0 | TMC pan STEP |
| PAN_DIR | PA1 | TMC pan DIR |
| PAN_ENABLE | PA2 | TMC pan EN |
| TILT_STEP | PA3 | TMC tilt STEP |
| TILT_DIR | PA4 | TMC tilt DIR |
| TILT_ENABLE | PA5 | TMC tilt EN |
| USART_TX | PA9 | Host RX |
| USART_RX | PA10 | Host TX |
| GND | GND | Host GND + driver GND |
| Optional pan min/max | PA6 / PA7 | Limit switches |
| Optional tilt min | PA8 | Limit switch |

Edit `firmware/config/hardware_config.h`. Do not hard-code another board in application code.

## Power

1. Power STM32 / UART first. Motors **off**. Enable inactive.
2. Confirm `$H` / `$T` parsing.
3. Jog at low current.
4. Then raise TMC current.

TMC UART (for stealthChop config) is **out of scope** for the MVP. STEP/DIR is enough.

## Mechanical

Camera on the **tilt** platform. Tilt on **pan**. Keep mass close to the tilt axis. Backlash shows up as hunting that no amount of Kd will hide.

## Direction convention

After wiring, jog:

| Command | Expected |
| --- | --- |
| left | pan decreases image X (target moves right in the frame) |
| right | opposite |
| up | tilt moves target down in the frame |
| down | opposite |
| stop | both axes halt |

If an axis is inverted, flip DIR in `hardware_config.h` or the TMC jumper — not the PID sign, unless you also invert the host Y (image Y is positive down).
