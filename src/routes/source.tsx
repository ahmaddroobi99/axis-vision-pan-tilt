import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FILES } from "@/content/sources";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/source")({ component: SourcePage });

function SourcePage() {
  const [active, setActive] = useState<(typeof FILES)[number]["id"]>("protocol.py");
  const file = FILES.find((f) => f.id === active) ?? FILES[0];

  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Host + firmware
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
          The same protocol in Python and C.
        </h1>
        <p className="text-muted-foreground">
          Original implementation: Python host for vision, STM32 C for STEP/DIR.
          This browser console runs the identical control law in TypeScript so
          you can see the loop without a bench.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {FILES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActive(f.id)}
            className={cn(
              "h-10 rounded-md px-3 font-mono text-xs transition-colors duration-150",
              f.id === active
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-muted-foreground hover:text-foreground",
            )}
          >
            {f.title}
          </button>
        ))}
      </div>

      <article className="overflow-hidden rounded-lg border border-border bg-card">
        <header className="border-b border-border px-4 py-3 font-mono text-xs text-muted-foreground">
          {file.title}
        </header>
        <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-6 text-foreground/90 sm:text-xs">
          {file.body}
        </pre>
      </article>
    </div>
  );
}
