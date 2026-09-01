import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PacketStream } from "@/components/tracker/PacketStream";
import {
  encodeAck,
  encodeEstop,
  encodeHeartbeat,
  encodeStop,
  encodeTarget,
  parsePacket,
  xorChecksum,
} from "@/lib/tracker/protocol";
import { useTracker } from "@/lib/tracker/store";

export const Route = createFileRoute("/protocol")({ component: ProtocolPage });

function ProtocolPage() {
  const fire = useTracker((s) => s.fire);
  const [x, setX] = useState(0.125);
  const [y, setY] = useState(-0.231);
  const [raw, setRaw] = useState("$T,0.125,-0.231,12345*48");

  const built = useMemo(() => encodeTarget(x, y, 12345).trim(), [x, y]);
  const parsed = useMemo(() => parsePacket(raw.endsWith("\n") ? raw : raw + "\r\n"), [raw]);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          UART protocol
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
          ASCII frames, XOR checksum, reject the rest.
        </h1>
        <p className="text-muted-foreground">
          Default 115200 8N1. A packet is <code className="font-mono text-foreground">$payload*CS</code>{" "}
          terminated with CR LF. The checksum is the XOR of every byte between
          <code className="font-mono text-foreground"> $ </code> and{" "}
          <code className="font-mono text-foreground">*</code>.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-card text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Frame</th>
              <th className="px-4 py-3 font-medium">Meaning</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            <Row t="$T" e={encodeTarget(0.125, -0.231, 12345)} n="Normalized target error" />
            <Row t="$S" e={encodeStop()} n="Stop motors, enter SAFE_STOP" />
            <Row t="$H" e={encodeHeartbeat()} n="Link keepalive" />
            <Row t="$A" e={encodeAck(true)} n="Firmware acknowledgement" />
            <Row t="$E" e={encodeEstop()} n="Emergency stop, motors disabled" />
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-medium">Build a T packet</h2>
          <label className="mb-3 block text-sm">
            X
            <input
              type="number"
              step={0.001}
              min={-1}
              max={1}
              value={x}
              onChange={(e) => setX(Number(e.target.value))}
              className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 font-mono"
            />
          </label>
          <label className="mb-3 block text-sm">
            Y
            <input
              type="number"
              step={0.001}
              min={-1}
              max={1}
              value={y}
              onChange={(e) => setY(Number(e.target.value))}
              className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 font-mono"
            />
          </label>
          <pre className="overflow-x-auto rounded-md bg-background px-3 py-3 font-mono text-xs">
            {built}
          </pre>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            payload XOR = {xorChecksum(`T,${x.toFixed(3)},${y.toFixed(3)},12345`)}
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-medium">Parse any frame</h2>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="h-24 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
            spellCheck={false}
          />
          <pre className="mt-3 overflow-x-auto rounded-md bg-background px-3 py-3 font-mono text-xs">
            {parsed.ok
              ? JSON.stringify(parsed.packet, null, 2)
              : `REJECT ${parsed.error}`}
          </pre>
        </section>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => fire("left")}>
          Send left
        </Button>
        <Button size="sm" variant="outline" onClick={() => fire("right")}>
          Send right
        </Button>
        <Button size="sm" variant="outline" onClick={() => fire("heartbeat")}>
          Heartbeat
        </Button>
        <Button size="sm" variant="outline" onClick={() => fire("stop")}>
          Stop
        </Button>
      </div>

      <PacketStream limit={18} />
    </div>
  );
}

function Row({ t, e, n }: { t: string; e: string; n: string }) {
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3 text-lock">{t}</td>
      <td className="px-4 py-3 text-foreground">{e.replace(/\r/g, "\\r").replace(/\n/g, "\\n")}</td>
      <td className="px-4 py-3 font-sans text-muted-foreground">{n}</td>
    </tr>
  );
}
