# Host

Python vision pipeline. Keep dependencies to OpenCV, NumPy, PySerial, PyYAML.

```
python3 -m host.main --simulation
python3 -m host.main --synthetic --debug
```

`--simulation` never opens a serial port. `--synthetic` never opens a camera.
