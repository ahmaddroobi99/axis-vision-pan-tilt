import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "lock" | "warn" | "danger" | "live";
}) {
  const tones = {
    muted: "bg-accent text-muted-foreground",
    lock: "bg-lock/15 text-lock",
    warn: "bg-warn/15 text-warn",
    danger: "bg-destructive/15 text-destructive",
    live: "bg-primary/12 text-primary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
