import { useEffect } from "react";
import { useTracker } from "@/lib/tracker/store";

export function LoopRunner() {
  const tick = useTracker((s) => s.tick);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.08);
      last = now;
      tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);

  return null;
}
