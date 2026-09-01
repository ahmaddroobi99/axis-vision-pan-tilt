# UART protocol

ASCII, easy to dump in a serial monitor. Default **115200 8N1**.

## Frame

```
$ <payload> * <CS> \r\n
```

- Start: `$`
- Payload: type and comma-separated fields, no `$` or `*`
- Checksum: XOR of every payload byte, two uppercase hex digits
- Terminator: CR LF

Example:

```
$T,0.125,-0.231,12345*62\r\n
```

## Types

### `$T` target

```
$T,<x>,<y>,<timestamp>*CS
```

| Field | Range | Meaning |
| --- | --- | --- |
| x | [-1, 1] | Normalized horizontal error |
| y | [-1, 1] | Normalized vertical error |
| timestamp | ≥ 0 | Host milliseconds |

Out-of-range values are **rejected**, not clamped, on the parser. The encoder clamps before TX.

### `$S` stop

```
$S*CS
```

Desired velocities go to 0. State → `SAFE_STOP`.

### `$H` heartbeat

```
$H*CS
```

Keeps the UART timeout from firing when there is no target update.

### `$A` acknowledgement (MCU → host)

```
$A,<0|1>*CS
```

`1` = OK, `0` = error.

### `$E` emergency stop

```
$E*CS
```

Motors disabled. Recovery requires an explicit reset, not a new `$T`.

## Parser rules

1. Must start with `$` and contain `*`.
2. Checksum must match.
3. Unknown type → reject.
4. `$T` must have three numeric fields.
5. `$T` x/y must lie in `[-1, 1]`.
6. Rejected packets produce **no** motor command.

## Timeouts

| Timer | Default | Action |
| --- | --- | --- |
| Target age | 300 ms | Host sends `$S`; MCU also stops if packets go stale |
| UART silence | 300 ms | `SAFE_STOP`, then disable if the link stays down |

## Host helpers

```python
from host.protocol import encode_target, parse_packet
raw = encode_target(0.125, -0.231, 12345)
pkt = parse_packet(raw)
```
