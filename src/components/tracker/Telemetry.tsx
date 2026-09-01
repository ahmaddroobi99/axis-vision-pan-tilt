import { Badge } from "@/components/ui/badge";
import { useTracker } from "@/lib/tracker/store";
import { formatSigned } from "@/lib/utils";
import type { FirmwareState } from "@/lib/tracker/types";

function toneFor(state: FirmwareState): "muted" | "lock" | "warn" | "danger" | "live" {
  if (state === "TRACKING") return "lock";
  if (state === "ESTOP") return "danger";
  if (state === "SAFE_STOP") return "warn";
  if (state === "HEARTBEAT") return "live";
  return "muted";
}

function Meter({
  label,
  value,
  min,
  max,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
}) {
  const span = max - min || 1;
  const pct = Math.min(100, Math.max(0, ((value - min) / span) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums text-foreground">
          {formatSigned(value, 1)} {unit}
        </span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-accent">
        <div
          className="absolute top-0 h-full bg-primary/80"
          style={{ left: 0, width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Telemetry() {
  const snap = useTracker((s) => s.snapshot);

  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium tracking-wide">STM32</h2>
        <Badge tone={toneFor(snap.firmwareState)}>{snap.firmwareState.replace("_", " ")}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">UART</dt>
          <dd className="mt-0.5 font-mono text-xs tabular-nums">
            {snap.uartConnected ? "LINK" : "DOWN"} · {snap.latencyMs.toFixed(0)} ms
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Target age</dt>
          <dd className="mt-0.5 font-mono text-xs tabular-nums">
            {Math.min(9999, Math.round(snap.targetAgeMs))} ms
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">MCU</dt>
          <dd className="mt-0.5 font-mono text-xs tabular-nums">{snap.mcuHz.toFixed(0)} Hz</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Host</dt>
          <dd className="mt-0.5 font-mono text-xs tabular-nums">{snap.hostHz.toFixed(0)} Hz</dd>
        </div>
      </dl>
      <div className="mt-5 space-y-4">
        <Meter label="Pan velocity" value={snap.pan.currentVel} min={-80} max={80} unit="°/s" />
        <Meter label="Tilt velocity" value={snap.tilt.currentVel} min={-60} max={60} unit="°/s" />
        <Meter label="Pan angle" value={snap.pan.positionDeg} min={-90} max={90} unit="°" />
        <Meter label="Tilt angle" value={snap.tilt.positionDeg} min={-45} max={45} unit="°" />
      </div>
      <p className="mt-4 font-mono text-[10px] text-muted-foreground">
        STEPS  P {snap.stepsPan.toFixed(0)}  T {snap.stepsTilt.toFixed(0)} · EN{" "}
        {snap.pan.enabled ? "1" : "0"}/{snap.tilt.enabled ? "1" : "0"}
      </p>
    </section>
  );
}
