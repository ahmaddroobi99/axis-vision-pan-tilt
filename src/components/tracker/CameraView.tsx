import { useEffect, useRef } from "react";
import { useTracker } from "@/lib/tracker/store";
import { webcamVideo } from "@/lib/tracker/webcam";
import { formatSigned } from "@/lib/utils";

function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  locked: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 78, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = locked ? "#cfd3cb" : "#8d8f8a";
  ctx.beginPath();
  ctx.moveTo(-22, 22);
  ctx.lineTo(22, 22);
  ctx.lineTo(30, 86);
  ctx.lineTo(-30, 86);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = locked ? "#b7bdb4" : "#7c7e79";
  ctx.beginPath();
  ctx.ellipse(0, 8, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = locked ? "#ddd9d1" : "#9a9892";
  ctx.beginPath();
  ctx.ellipse(0, -18, 20, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = locked ? "#3c3d3a" : "#2a2b29";
  ctx.beginPath();
  ctx.ellipse(0, -30, 20, 14, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-20, -32, 40, 10);

  ctx.fillStyle = "#1a1b19";
  ctx.beginPath();
  ctx.ellipse(-7, -18, 2.2, 2.6, 0, 0, Math.PI * 2);
  ctx.ellipse(7, -18, 2.2, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5c5d58";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, -6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -2, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pan: number,
  tilt: number,
) {
  const horizon = h * 0.46 + tilt * 3.4;
  const shift = pan * 7.2;

  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#14161b");
  sky.addColorStop(1, "#1b1e25");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, Math.max(0, horizon));

  const floor = ctx.createLinearGradient(0, horizon, 0, h);
  floor.addColorStop(0, "#16181d");
  floor.addColorStop(1, "#0d0e11");
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizon, w, h - horizon);

  ctx.strokeStyle = "rgba(200,205,196,0.08)";
  ctx.lineWidth = 1;
  const vanishingX = w / 2 - shift * 0.15;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(vanishingX, horizon);
    ctx.lineTo(w / 2 + i * 90 - shift, h + 20);
    ctx.stroke();
  }
  for (let i = 1; i <= 10; i++) {
    const y = horizon + Math.pow(i / 10, 1.6) * (h - horizon);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(200,205,196,0.12)";
  for (let i = -3; i <= 3; i++) {
    const x = w / 2 + i * 120 - shift;
    ctx.strokeRect(x - 36, horizon - 150 + tilt * 1.5, 72, 150);
  }
}

function drawReticle(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  ctx.strokeStyle = "rgba(215,219,210,0.55)";
  ctx.lineWidth = 1;
  const arm = 18;
  ctx.beginPath();
  ctx.moveTo(cx - arm, cy);
  ctx.lineTo(cx + arm, cy);
  ctx.moveTo(cx, cy - arm);
  ctx.lineTo(cx, cy + arm);
  ctx.stroke();
  ctx.strokeRect(cx - 7, cy - 7, 14, 14);

  ctx.strokeStyle = "rgba(215,219,210,0.28)";
  const m = 22;
  const len = 28;
  ctx.beginPath();
  ctx.moveTo(m, m);
  ctx.lineTo(m + len, m);
  ctx.moveTo(m, m);
  ctx.lineTo(m, m + len);
  ctx.moveTo(w - m, m);
  ctx.lineTo(w - m - len, m);
  ctx.moveTo(w - m, m);
  ctx.lineTo(w - m, m + len);
  ctx.moveTo(m, h - m);
  ctx.lineTo(m + len, h - m);
  ctx.moveTo(m, h - m);
  ctx.lineTo(m, h - m - len);
  ctx.moveTo(w - m, h - m);
  ctx.lineTo(w - m - len, h - m);
  ctx.moveTo(w - m, h - m);
  ctx.lineTo(w - m, h - m - len);
  ctx.stroke();
  ctx.restore();
}

function drawAfBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  locked: boolean,
) {
  ctx.save();
  ctx.strokeStyle = locked ? "#8fa38a" : "rgba(196,165,116,0.9)";
  ctx.lineWidth = 1.5;
  const c = 12;
  ctx.beginPath();
  ctx.moveTo(x, y + c);
  ctx.lineTo(x, y);
  ctx.lineTo(x + c, y);
  ctx.moveTo(x + w - c, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + c);
  ctx.moveTo(x + w, y + h - c);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - c, y + h);
  ctx.moveTo(x + c, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.stroke();
  ctx.restore();
}

export function CameraView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshot = useTracker((s) => s.snapshot);
  const config = useTracker((s) => s.config);
  const debug = useTracker((s) => s.debug);
  const setDrag = useTracker((s) => s.setDrag);
  const setWebcam = useTracker((s) => s.setWebcam);
  const mode = useTracker((s) => s.mode);

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

    const video = webcamVideo.current;
    const live =
      mode === "webcam" && video && video.readyState >= 2 && video.videoWidth > 0;

    if (live && video) {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const cover = Math.max(w / vw, h / vh);
      const dw = vw * cover;
      const dh = vh * cover;
      ctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.fillStyle = "rgba(11,12,14,0.18)";
      ctx.fillRect(0, 0, w, h);
    } else {
      drawGrid(ctx, w, h, snapshot.pan.positionDeg, snapshot.tilt.positionDeg);
    }

    const sx = w / config.camera.width;
    const sy = h / config.camera.height;
    const det = snapshot.detection;
    if (!live && det) {
      const px = det.x * sx + (det.width * sx) / 2;
      const py = det.y * sy + (det.height * sy) / 2;
      const scale = (det.height * sy) / 110;
      drawPerson(ctx, px, py, scale, snapshot.firmwareState === "TRACKING");
      drawAfBox(
        ctx,
        det.x * sx,
        det.y * sy,
        det.width * sx,
        det.height * sy,
        snapshot.detected,
      );

      if (debug) {
        ctx.strokeStyle = "rgba(200,205,196,0.45)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#c8cdc4";
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (live && snapshot.detected) {
      const px = w / 2 + snapshot.rawX * (w / 2);
      const py = h / 2 + snapshot.rawY * (h / 2);
      drawAfBox(ctx, px - 40, py - 52, 80, 104, true);
    } else if (!snapshot.detected) {
      ctx.fillStyle = "rgba(236,236,232,0.55)";
      ctx.font = "500 13px 'Instrument Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(live ? "NO FACE · TAP TO TRACK" : "TARGET LOST", w / 2, h / 2 - 8);
      ctx.fillStyle = "rgba(154,155,150,0.8)";
      ctx.font = "400 11px 'IBM Plex Mono', monospace";
      ctx.fillText("motors holding / decelerating", w / 2, h / 2 + 12);
    }

    drawReticle(ctx, w, h);

    ctx.fillStyle = "rgba(11,12,14,0.55)";
    ctx.fillRect(12, 12, 168, 54);
    ctx.strokeStyle = "rgba(42,44,49,0.9)";
    ctx.strokeRect(12.5, 12.5, 167, 53);
    ctx.fillStyle = "#ecece8";
    ctx.font = "500 11px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`X ${formatSigned(snapshot.hostX)}`, 22, 32);
    ctx.fillText(`Y ${formatSigned(snapshot.hostY)}`, 22, 50);
    ctx.fillStyle = snapshot.detected ? "#8fa38a" : "#c4a574";
    ctx.fillText(snapshot.detected ? "LOCK" : "LOST", 118, 32);
    ctx.fillStyle = "#9a9b96";
    ctx.fillText(`${Math.round(snapshot.fps)} FPS`, 118, 50);

    if (debug) {
      ctx.fillStyle = "rgba(11,12,14,0.5)";
      ctx.fillRect(12, h - 58, 220, 46);
      ctx.fillStyle = "#9a9b96";
      ctx.font = "400 10px 'IBM Plex Mono', monospace";
      ctx.fillText(
        `raw ${formatSigned(snapshot.rawX, 2)} ${formatSigned(snapshot.rawY, 2)}`,
        22,
        h - 38,
      );
      ctx.fillText(
        `filt ${formatSigned(snapshot.filteredX, 2)} ${formatSigned(snapshot.filteredY, 2)}`,
        22,
        h - 22,
      );
    }
  });

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0 && e.type !== "pointerdown") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    if (mode === "webcam") {
      setWebcam(nx, ny, true);
      return;
    }
    const az = snapshot.pan.positionDeg + nx * (config.camera.fovH / 2);
    const el = snapshot.tilt.positionDeg - ny * (config.camera.fovV / 2);
    setDrag(az, el);
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-panel)]">
      <canvas
        ref={canvasRef}
        className="block aspect-[16/10] w-full touch-none bg-background"
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          onPointer(e);
        }}
        onPointerMove={onPointer}
        role="img"
        aria-label="Live camera view with tracking overlay"
      />
      <div className="pointer-events-none absolute right-3 top-3 rounded-sm border border-border/80 bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {mode === "webcam" ? "usb camera" : mode === "drag" ? "drag target" : "synthetic · sim"}
      </div>
    </div>
  );
}
