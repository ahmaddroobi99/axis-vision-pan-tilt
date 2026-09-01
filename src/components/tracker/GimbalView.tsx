import { useEffect, useRef } from "react";
import { useTracker } from "@/lib/tracker/store";

export function GimbalView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pan = useTracker((s) => s.snapshot.pan);
  const tilt = useTracker((s) => s.snapshot.tilt);
  const state = useTracker((s) => s.snapshot.firmwareState);

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
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#121317";
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.58;
    const panRad = (pan.positionDeg * Math.PI) / 180;
    const tiltRad = (tilt.positionDeg * Math.PI) / 180;

    ctx.fillStyle = "#0d0e11";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 62, 78, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1c1e24";
    ctx.strokeStyle = "#3a3d44";
    ctx.lineWidth = 1.2;
    roundRect(ctx, cx - 48, cy + 28, 96, 18, 4);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy + 20);
    ctx.rotate(panRad * 0.35);

    ctx.strokeStyle = "#c8cdc4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 8, 40, 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#8fa38a";
    ctx.beginPath();
    ctx.ellipse(0, 8, 40, 10, 0, -0.4 + panRad, 0.4 + panRad);
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(panRad * 0.2);

    ctx.strokeStyle = "#9a9b96";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-34, 8);
    ctx.quadraticCurveTo(-38, -36, -8, -52);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(34, 8);
    ctx.quadraticCurveTo(38, -36, 8, -52);
    ctx.stroke();

    ctx.save();
    ctx.translate(0, -52);
    ctx.rotate(-tiltRad * 0.9);

    ctx.fillStyle = "#2a2c31";
    ctx.strokeStyle = "#c8cdc4";
    ctx.lineWidth = 1.4;
    roundRect(ctx, -22, -16, 44, 28, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0b0c0e";
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = state === "TRACKING" ? "#8fa38a" : "#6e6f6a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#9a9b96";
    ctx.fillRect(9, -3, 18, 6);
    ctx.fillStyle = "#c8cdc4";
    ctx.beginPath();
    ctx.arc(28, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();

    ctx.fillStyle = "#9a9b96";
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAN / TILT ASSEMBLY", cx, 22);
    ctx.fillStyle = "#ecece8";
    ctx.fillText(
      `P ${pan.positionDeg >= 0 ? "+" : ""}${pan.positionDeg.toFixed(1)}°   T ${
        tilt.positionDeg >= 0 ? "+" : ""
      }${tilt.positionDeg.toFixed(1)}°`,
      cx,
      h - 16,
    );
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <canvas
        ref={canvasRef}
        className="block h-[240px] w-full sm:h-[280px]"
        role="img"
        aria-label="Pan tilt gimbal visualization"
      />
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
