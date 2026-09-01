import { useTracker } from "@/lib/tracker/store";
import type { AxisGains, TrackerConfig } from "@/lib/tracker/types";

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v: number) => v.toFixed(2),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full accent-primary"
      />
    </label>
  );
}

function AxisEditor({
  title,
  axis,
  onChange,
}: {
  title: string;
  axis: AxisGains;
  onChange: (next: AxisGains) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-medium tracking-wide">{title}</h3>
      <div className="space-y-3">
        <SliderRow
          label="Kp"
          value={axis.kp}
          min={0}
          max={3}
          step={0.05}
          onChange={(kp) => onChange({ ...axis, kp })}
        />
        <SliderRow
          label="Ki"
          value={axis.ki}
          min={0}
          max={1.2}
          step={0.01}
          onChange={(ki) => onChange({ ...axis, ki })}
        />
        <SliderRow
          label="Kd"
          value={axis.kd}
          min={0}
          max={0.6}
          step={0.01}
          onChange={(kd) => onChange({ ...axis, kd })}
        />
        <SliderRow
          label="Max speed"
          value={axis.maxSpeed}
          min={10}
          max={140}
          step={1}
          format={(v) => `${v.toFixed(0)} °/s`}
          onChange={(maxSpeed) => onChange({ ...axis, maxSpeed })}
        />
        <SliderRow
          label="Acceleration"
          value={axis.acceleration}
          min={40}
          max={500}
          step={5}
          format={(v) => `${v.toFixed(0)} °/s²`}
          onChange={(acceleration) => onChange({ ...axis, acceleration })}
        />
      </div>
    </section>
  );
}

export function GainPanel() {
  const config = useTracker((s) => s.config);
  const setConfig = useTracker((s) => s.setConfig);

  const patch = (fn: (c: TrackerConfig) => TrackerConfig) => setConfig(fn);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AxisEditor
        title="Pan axis"
        axis={config.pan}
        onChange={(pan) => patch((c) => ({ ...c, pan }))}
      />
      <AxisEditor
        title="Tilt axis"
        axis={config.tilt}
        onChange={(tilt) => patch((c) => ({ ...c, tilt }))}
      />
      <section className="rounded-lg border border-border bg-card p-4 sm:p-5 lg:col-span-2">
        <h3 className="mb-4 text-sm font-medium tracking-wide">Vision filter</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <SliderRow
            label="Filter alpha"
            value={config.tracking.filterAlpha}
            min={0.05}
            max={0.9}
            step={0.01}
            onChange={(filterAlpha) =>
              patch((c) => ({ ...c, tracking: { ...c.tracking, filterAlpha } }))
            }
          />
          <SliderRow
            label="Deadband"
            value={config.tracking.deadband}
            min={0}
            max={0.25}
            step={0.005}
            onChange={(deadband) =>
              patch((c) => ({ ...c, tracking: { ...c.tracking, deadband } }))
            }
          />
          <SliderRow
            label="Target timeout"
            value={config.tracking.targetTimeoutMs}
            min={80}
            max={1200}
            step={10}
            format={(v) => `${v.toFixed(0)} ms`}
            onChange={(targetTimeoutMs) =>
              patch((c) => ({
                ...c,
                tracking: { ...c.tracking, targetTimeoutMs },
              }))
            }
          />
        </div>
      </section>
    </div>
  );
}
