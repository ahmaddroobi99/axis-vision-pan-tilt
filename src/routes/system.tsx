import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/system")({ component: SystemPage });

const BLOCKS = [
  { k: "Camera", d: "USB webcam, 640×480 @ 30 FPS" },
  { k: "Detector", d: "Haar / synthetic / optional YOLO" },
  { k: "Tracker", d: "Center, normalize, deadband, filter" },
  { k: "UART", d: "$T,x,y,ts*CS @ 115200 8N1" },
  { k: "STM32", d: "Parse, PID, accel ramp, safety" },
  { k: "TMC + motors", d: "STEP/DIR pan and tilt" },
];

const PINS = [
  ["PAN_STEP", "PA0", "TMC pan STEP"],
  ["PAN_DIR", "PA1", "TMC pan DIR"],
  ["PAN_EN", "PA2", "TMC pan EN"],
  ["TILT_STEP", "PA3", "TMC tilt STEP"],
  ["TILT_DIR", "PA4", "TMC tilt DIR"],
  ["TILT_EN", "PA5", "TMC tilt EN"],
  ["USART_TX", "PA9", "Host RX"],
  ["USART_RX", "PA10", "Host TX"],
  ["GND", "GND", "Common ground required"],
];

export function SystemPage() {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Architecture
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
          One vertical slice. Host vision, MCU motion.
        </h1>
        <p className="text-muted-foreground">
          The computer never drives coils. It only publishes a normalized error.
          The STM32 owns velocity, acceleration, enable, and every timeout.
        </p>
      </header>

      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {BLOCKS.map((b, i) => (
          <li
            key={b.k}
            className="relative rounded-lg border border-border bg-card p-4"
          >
            <span className="font-mono text-[11px] text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2 className="mt-2 text-base font-medium">{b.k}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
            {i < BLOCKS.length - 1 && (
              <ArrowRight className="absolute -right-3 top-1/2 hidden size-4 -translate-y-1/2 text-muted-foreground lg:block" />
            )}
          </li>
        ))}
      </ol>

      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-medium tracking-wide">Signal path</h2>
        <pre className="overflow-x-auto font-mono text-[11px] leading-6 text-muted-foreground sm:text-xs">
{`USB CAMERA
    │  frames
    ▼
Python / OpenCV          detector → target (tx, ty)
    │  error = (tx-cx)/(w/2), (ty-cy)/(h/2)
    │  clamp [-1, +1], deadband, exp smooth
    ▼
UART  $T,ex,ey,ts*CS
    ▼
STM32 parser → PID → velocity limit → accel ramp
    ▼
TMC2208/2209  STEP / DIR / EN
    ├──────────────┐
    ▼              ▼
 PAN MOTOR     TILT MOTOR
    └────── CAMERA ┘`}
        </pre>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium tracking-wide">Wiring</h2>
        <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
          Logic 3.3 V, motors 12–24 V on a separate supply. Tie grounds. Enable
          is idle-high disabled at boot. Pins live in{" "}
          <code className="font-mono text-foreground">hardware_config.h</code>.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-card text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Signal</th>
                <th className="px-4 py-3 font-medium">STM32</th>
                <th className="px-4 py-3 font-medium">Goes to</th>
              </tr>
            </thead>
            <tbody>
              {PINS.map((row) => (
                <tr key={row[0]} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{row[0]}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row[1]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium">Firmware states</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>IDLE — motors disabled, waiting for a valid frame</li>
            <li>TRACKING — T packets, PID running, STEP/DIR live</li>
            <li>SAFE_STOP — target or UART timeout, velocity ramps to 0</li>
            <li>ESTOP — outputs disabled until reset</li>
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium">Safety defaults</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Boot with EN inactive</li>
            <li>Target timeout 300 ms → stop</li>
            <li>UART timeout 300 ms → stop</li>
            <li>Malformed packet ignored, never commanded</li>
            <li>Velocity and acceleration clamped per axis</li>
          </ul>
        </div>
      </section>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowDown className="size-3.5" />
        Physical motors, TMC current, and the printed chassis are not verified
        in this browser MVP. The control law and protocol are.
      </p>
    </div>
  );
}
