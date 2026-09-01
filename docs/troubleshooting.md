# Troubleshooting

## No camera

- Try `--synthetic` / the console Patrol mode.
- Check index in `config.yaml`.
- Permissions on `/dev/video*`.

## Detector never fires

- Haar needs a roughly frontal face and enough light.
- Confirm the cascade XML shipped with OpenCV.
- Use synthetic motion to test the rest of the pipe.

## UART does not connect

- 115200 8N1, correct `/dev/ttyACM*` or `ttyUSB*`.
- TX/RX crossed: host TX → MCU RX.
- Common ground.
- `python3 tools/packet_test.py` before blaming the MCU.

## Motors do nothing

- Enable still inactive? First **valid** `$T` should enable.
- E-stop latched?
- Driver VM present? Logic-only will parse and still not move.
- EN polarity (`ENABLE_ACTIVE_LOW`).

## Motors run away

- **Power down.** Then:
  - Confirm checksum rejects garbage.
  - Confirm timeout 300 ms.
  - Confirm `$S` on target loss.
  - Do not raise Kp until jog directions are correct.

## Firmware will not build

- MVP parser compiles with host `gcc` (`firmware/App/protocol_host.c`).
- Device build needs CubeMX / `arm-none-eabi-gcc` and a board pack. That path is **not verified** here.
