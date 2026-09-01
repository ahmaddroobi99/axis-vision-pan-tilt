import { useTracker } from "@/lib/tracker/store";
import { displayPacket } from "@/lib/tracker/protocol";
import { cn } from "@/lib/utils";

export function PacketStream({ limit = 12 }: { limit?: number }) {
  const packets = useTracker((s) => s.snapshot.packets);

  return (
    <section className="flex min-h-[220px] flex-col rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium tracking-wide">UART 115200 8N1</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Host → STM32
        </span>
      </header>
      <div className="flex-1 space-y-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed">
        {packets.length === 0 ? (
          <p className="px-1 py-6 text-center text-muted-foreground">Waiting for packets</p>
        ) : (
          packets.slice(0, limit).map((p) => (
            <div key={p.id} className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 inline-flex w-5 shrink-0 justify-center rounded-xs text-[10px]",
                  p.ok ? "bg-lock/15 text-lock" : "bg-destructive/15 text-destructive",
                )}
              >
                {p.kind}
              </span>
              <span className="min-w-0 break-all text-foreground/90">
                {displayPacket(p.raw)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
