import { createFileRoute } from "@tanstack/react-router";
import { GainPanel } from "@/components/tracker/GainPanel";
import { Scope } from "@/components/tracker/Scope";
import { CameraView } from "@/components/tracker/CameraView";
import { useTracker } from "@/lib/tracker/store";
import { formatSigned } from "@/lib/utils";

export const Route = createFileRoute("/lab")({ component: LabPage });

function LabPage() {
  const snap = useTracker((s) => s.snapshot);
  const cfg = useTracker((s) => s.config);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Control lab
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
          Tune Kp first. Add D only if it rings.
        </h1>
        <p className="text-muted-foreground">
          Default is proportional control with a little derivative damping.
          Integral stays at zero unless a persistent offset remains after the
          deadband. Acceleration ramps keep steppers from skipping.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Scope />
        <CameraView />
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 font-mono text-xs tabular-nums sm:grid-cols-4">
        <Stat k="Pan cmd" v={`${formatSigned(snap.pan.targetVel, 1)} °/s`} />
        <Stat k="Tilt cmd" v={`${formatSigned(snap.tilt.targetVel, 1)} °/s`} />
        <Stat k="Kp pan" v={cfg.pan.kp.toFixed(2)} />
        <Stat k="Kd pan" v={cfg.pan.kd.toFixed(2)} />
      </div>

      <GainPanel />

      <section className="max-w-2xl space-y-3 text-sm text-muted-foreground">
        <h2 className="text-foreground">How to read the plant</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-foreground">Jitter</span> — detection noise.
            Lower alpha, raise deadband.
          </li>
          <li>
            <span className="text-foreground">Overshoot</span> — Kp too high or
            acceleration too aggressive. Drop Kp, add a little Kd.
          </li>
          <li>
            <span className="text-foreground">Sluggish</span> — raise Kp or max
            speed. Check the target is not sitting inside the deadband.
          </li>
          <li>
            <span className="text-foreground">Missed steps (hardware)</span> —
            lower acceleration and current-limit the TMC, not the controller
            gains.
          </li>
        </ul>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {k}
      </div>
      <div className="mt-1 text-foreground">{v}</div>
    </div>
  );
}
