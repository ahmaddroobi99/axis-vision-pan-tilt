import { createFileRoute } from "@tanstack/react-router";
import { CameraView } from "@/components/tracker/CameraView";
import { ControlBar } from "@/components/tracker/ControlBar";
import { GimbalView } from "@/components/tracker/GimbalView";
import { PacketStream } from "@/components/tracker/PacketStream";
import { Telemetry } from "@/components/tracker/Telemetry";

export const Route = createFileRoute("/")({ component: TrackPage });

function TrackPage() {
  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Live closed loop
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
          Camera follows the subject.
        </h1>
        <p className="text-muted-foreground">
          USB camera → detect → normalize error → UART → STM32 PID → STEP/DIR
          → pan/tilt. Drag the person, or let them patrol. Tracking holds them
          on the reticle.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <CameraView />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <GimbalView />
          <Telemetry />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-medium tracking-wide">Host</h2>
          <ControlBar />
        </section>
        <PacketStream />
      </div>
    </div>
  );
}
