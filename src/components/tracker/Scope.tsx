import { useEffect, useRef } from "react";
import { useTracker } from "@/lib/tracker/store";

interface Sample {
  t: number;
  targetAz: number;
  pan: number;
  errX: number;
  cmd: number;
}

const MAX = 240;

export function Scope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buf = useRef<Sample[]>([]);
  const snap = useTracker((s) => s.snapshot);

  useEffect(() => {
    buf.current.push({
      t: snap.time,
      targetAz: snap.worldAz,
      pan: snap.pan.positionDeg,
      errX: snap.hostX,
      cmd: snap.pan.currentVel / 80,
    });
    if (buf.current.length > MAX) buf.current.splice(0, buf.current.length - MAX);
  }, [snap.time, snap.worldAz, snap.pan.positionDeg, snap.hostX, snap.pan.currentVel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#121317";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(42,44,49,1)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (h * i) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const data = buf.current;
    if (data.length < 2) return;
    const t0 = data[0].t;
    const t1 = data[data.length - 1].t;
    const span = Math.max(0.2, t1 - t0);

    const plot = (key: keyof Sample, color: string, scale: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      data.forEach((s, i) => {
        const x = ((s.t - t0) / span) * w;
        const y = h / 2 - (Number(s[key]) / scale) * (h * 0.42);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    plot("targetAz", "rgba(154,155,150,0.9)", 40);
    plot("pan", "#c8cdc4", 40);
    plot("errX", "#8fa38a", 1.2);

    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "#9a9b96";
    ctx.fillText("target az", 12, 18);
    ctx.fillStyle = "#c8cdc4";
    ctx.fillText("camera pan", 92, 18);
    ctx.fillStyle = "#8fa38a";
    ctx.fillText("error x", 184, 18);
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <canvas
        ref={canvasRef}
        className="block h-52 w-full sm:h-64"
        role="img"
        aria-label="Control scope: target, camera, error"
      />
    </div>
  );
}
