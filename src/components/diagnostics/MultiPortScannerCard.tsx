"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDuration } from "@/lib/utils/formatters";
import { Network, RefreshCw } from "lucide-react";

interface PortScanItem {
  port: number;
  service: string;
  status: "open" | "closed" | "timeout" | "forbidden" | "pending";
  durationMs: number;
}

const COMMON_PORT_DEFINITIONS: { port: number; service: string }[] = [
  { port: 80, service: "HTTP Web" },
  { port: 443, service: "HTTPS Web (TLS)" },
  { port: 22, service: "SSH Remote" },
  { port: 53, service: "DNS (TCP)" },
  { port: 853, service: "DNS-over-TLS" },
  { port: 8080, service: "HTTP-Alt / Proxy" },
  { port: 8443, service: "HTTPS-Alt" },
  { port: 3306, service: "MySQL Database" },
  { port: 5432, service: "PostgreSQL DB" },
  { port: 25, service: "SMTP Mail" },
];

export function MultiPortScannerCard({ targetHost = "cloudflare.com" }: { targetHost?: string }) {
  const [host, setHost] = useState<string>(targetHost);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [portResults, setPortResults] = useState<PortScanItem[]>([]);
  const [scanSummary, setScanSummary] = useState<string | null>(null);

  async function handleScan() {
    if (!host.trim() || isScanning) return;

    setIsScanning(true);
    setScanSummary(null);

    // Initial pending items
    const initial = COMMON_PORT_DEFINITIONS.map((def) => ({
      ...def,
      status: "pending" as const,
      durationMs: 0,
    }));
    setPortResults(initial);

    try {
      const res = await fetch("/api/tcp-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: host.trim(),
          ports: COMMON_PORT_DEFINITIONS.map((d) => d.port),
        }),
      });

      const data = await res.json();

      if (data.results && Array.isArray(data.results)) {
        const mapped = COMMON_PORT_DEFINITIONS.map((def) => {
          const match = data.results.find((r: { port: number }) => r.port === def.port);
          return {
            ...def,
            status: match ? match.status : "closed",
            durationMs: match ? match.durationMs : 0,
          };
        });
        setPortResults(mapped);

        const openCount = mapped.filter((m) => m.status === "open").length;
        setScanSummary(
          `Scan completed for ${data.resolvedIp || host}: ${openCount} open ports identified out of ${mapped.length} checked.`
        );
      } else if (data.status === "forbidden") {
        setScanSummary(data.message || "SSRF Protection blocked private network probe.");
      }
    } catch (err) {
      console.warn("Port scan request error:", err);
      setScanSummary("Backend scan error or timeout occurred.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <Card className="mt-4 border-radar-indigo/20">
      <CardHeader>
        <CardTitle>
          <Network className="w-4 h-4 text-radar-indigo" />
          Multi-Port Service Matrix Scanner
        </CardTitle>
        <Badge variant="cyan">Node.js Handshake Agent</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-radar-muted">
          Performs concurrent Layer-4 TCP handshakes against standard enterprise service ports with automatic SSRF filtering:
        </p>

        {/* Input & Action */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="Host or domain to scan (e.g. 1.1.1.1)"
            className="flex-1 bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-radar-subtle focus:outline-none focus:ring-1 focus:ring-radar-teal"
          />
          <Button
            size="sm"
            onClick={handleScan}
            isLoading={isScanning}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Scan Common Ports (10)
          </Button>
        </div>

        {scanSummary && (
          <div className="p-3 rounded-lg bg-radar-bg border border-radar-border text-xs font-mono text-radar-teal">
            {scanSummary}
          </div>
        )}

        {/* Port Grid */}
        {portResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            {portResults.map((item) => {
              const isOpen = item.status === "open";
              const isTimeout = item.status === "timeout";
              const isPending = item.status === "pending";

              return (
                <div
                  key={item.port}
                  className={`p-3 rounded-lg border transition-all ${
                    isOpen
                      ? "bg-emerald-950/20 border-emerald-500/40 shadow-noc-glow"
                      : isTimeout
                      ? "bg-amber-950/15 border-amber-500/30"
                      : "bg-radar-bg border-radar-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold font-mono text-white">
                      :{item.port}
                    </span>
                    <Badge
                      variant={
                        isOpen
                          ? "emerald"
                          : isTimeout
                          ? "amber"
                          : isPending
                          ? "muted"
                          : "outline"
                      }
                      className="text-[9px] uppercase px-1.5 py-0"
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <span className="text-[11px] text-radar-subtle block truncate">
                    {item.service}
                  </span>

                  <span className="text-[10px] font-mono text-radar-muted mt-1 block">
                    {isPending ? (
                      <span className="animate-pulse text-radar-teal">Probing...</span>
                    ) : item.durationMs > 0 ? (
                      formatDuration(item.durationMs)
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
