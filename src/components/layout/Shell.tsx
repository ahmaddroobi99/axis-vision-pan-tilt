import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Aperture,
  Binary,
  BookOpen,
  Cpu,
  Crosshair,
  SlidersHorizontal,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Track", icon: Crosshair },
  { to: "/lab", label: "Control", icon: SlidersHorizontal },
  { to: "/protocol", label: "UART", icon: Binary },
  { to: "/system", label: "System", icon: Aperture },
  { to: "/source", label: "Source", icon: Cpu },
  { to: "/guide", label: "Guide", icon: BookOpen },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 pr-2">
            <span className="flex size-8 items-center justify-center rounded-sm border border-border bg-card">
              <Crosshair className="size-4 text-primary" strokeWidth={1.75} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-sans text-[15px] font-semibold tracking-[0.18em]">
                AXIS
              </span>
              <span className="mt-0.5 hidden text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
                Vision tracker
              </span>
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 sm:pt-7">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-6 px-1 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.12em]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
