import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTracker } from "@/lib/tracker/store";
import type { TargetMode } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";
import { Pause, Play, RotateCcw, ShieldAlert } from "lucide-react";

const MODES: { id: TargetMode; label: string }[] = [
  { id: "patrol", label: "Patrol" },
  { id: "figure8", label: "Figure-8" },
  { id: "drag", label: "Drag" },
  { id: "still", label: "Still" },
  { id: "webcam", label: "Webcam" },
];

export function ControlBar() {
  const running = useTracker((s) => s.running);
  const tracking = useTracker((s) => s.trackingEnabled);
  const estop = useTracker((s) => s.estop);
  const mode = useTracker((s) => s.mode);
  const debug = useTracker((s) => s.debug);
  const setRunning = useTracker((s) => s.setRunning);
  const setTracking = useTracker((s) => s.setTracking);
  const setEstop = useTracker((s) => s.setEstop);
  const setMode = useTracker((s) => s.setMode);
  const reset = useTracker((s) => s.reset);
  const setDebug = useTracker((s) => s.setDebug);
  const fire = useTracker((s) => s.fire);
  const snap = useTracker((s) => s.snapshot);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={snap.detected ? "lock" : "warn"}>
          {snap.detected ? "Target acquired" : "No target"}
        </Badge>
        <Badge tone={snap.uartConnected ? "live" : "muted"}>
          {snap.uartConnected ? "UART up" : "UART idle"}
        </Badge>
        {estop && <Badge tone="danger">E-stop</Badge>}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={running ? "outline" : "default"}
          onClick={() => setRunning(!running)}
        >
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {running ? "Pause" : "Run"}
        </Button>
        <Button
          size="sm"
          variant={tracking ? "lock" : "outline"}
          onClick={() => setTracking(!tracking)}
          disabled={estop}
        >
          {tracking ? "Tracking on" : "Tracking off"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => reset()}>
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
        <Button
          size="sm"
          variant={estop ? "default" : "danger"}
          onClick={() => setEstop(!estop)}
        >
          <ShieldAlert className="size-3.5" />
          {estop ? "Clear E-stop" : "E-stop"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDebug(!debug)}>
          Debug {debug ? "on" : "off"}
        </Button>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Target motion
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                "h-10 rounded-md px-3 text-sm transition-colors duration-150",
                mode === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Drag the subject in the viewfinder, or run a patrol path. Webcam uses
          the Face Detector API when the browser provides it.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Hardware-in-the-loop jog
        </p>
        <div className="grid grid-cols-3 gap-1.5 sm:max-w-xs">
          <span />
          <Button size="sm" variant="outline" onClick={() => fire("up")}>
            Up
          </Button>
          <span />
          <Button size="sm" variant="outline" onClick={() => fire("left")}>
            Left
          </Button>
          <Button size="sm" variant="outline" onClick={() => fire("center")}>
            Center
          </Button>
          <Button size="sm" variant="outline" onClick={() => fire("right")}>
            Right
          </Button>
          <span />
          <Button size="sm" variant="outline" onClick={() => fire("down")}>
            Down
          </Button>
          <Button size="sm" variant="ghost" onClick={() => fire("stop")}>
            Stop
          </Button>
        </div>
      </div>
    </div>
  );
}
