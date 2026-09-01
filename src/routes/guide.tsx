import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/guide")({ component: GuidePage });

export function GuidePage() {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Field guide
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
          Functional engineering MVP.
        </h1>
        <p className="text-muted-foreground">
          Software of the loop is verified here. Physical motors, TMC current
          trim, and the printed chassis are not. Do not claim a hardware lock
          until the camera actually rides the gimbal.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2">
        <Card title="Software verified">
          <ul>
            <li>Normalized error, deadband, exponential filter</li>
            <li>ASCII UART framing and checksum</li>
            <li>Malformed packet rejection</li>
            <li>P / PI / PID with anti-windup</li>
            <li>Acceleration-limited motor model</li>
            <li>Target-loss and UART-loss stop</li>
            <li>E-stop disables enable</li>
            <li>Synthetic patrol / drag / figure-8</li>
          </ul>
        </Card>
        <Card title="Not physically verified">
          <ul>
            <li>STM32 binary on a development board</li>
            <li>TMC2208/2209 current and microstepping</li>
            <li>Stepper wiring and mechanical backlash</li>
            <li>USB camera open on this machine</li>
            <li>End-to-end person-following on hardware</li>
          </ul>
        </Card>
      </section>

      <section className="max-w-2xl space-y-3">
        <h2 className="text-lg font-medium">Bring-up on a bench</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Power logic first. Motors unpowered. EN inactive.</li>
          <li>Open UART at 115200. Send $H, expect a parser ACK.</li>
          <li>Jog: left / right / up / down / center / stop. Confirm directions.</li>
          <li>If an axis is inverted, flip DIR in hardware_config.h or the TMC jumper.</li>
          <li>Power motors at a conservative current. Repeat jog.</li>
          <li>Raise Kp from ~0.4 until the camera keeps a walking subject in frame.</li>
          <li>If it oscillates, cut Kp, add a little Kd, never start with Ki.</li>
        </ol>
      </section>

      <section className="max-w-2xl space-y-3">
        <h2 className="text-lg font-medium">Host commands</h2>
        <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 font-mono text-xs leading-6">
{`python -m host.main --simulation
python -m host.main --synthetic
python -m host.main --debug
python simulation/tracker_sim.py
pytest -q
python tools/packet_test.py`}
        </pre>
      </section>

      <section className="max-w-2xl space-y-3 text-sm text-muted-foreground">
        <h2 className="text-lg font-medium text-foreground">Safety</h2>
        <p>
          Never leave motors enabled without a timeout. A lost USB camera must
          look like a lost target: STOP. Keep a hardware e-stop in series with
          motor supply for anything bigger than a desktop gimbal.
        </p>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-3 text-sm text-muted-foreground [&_li]:mt-1.5">{children}</div>
    </section>
  );
}
