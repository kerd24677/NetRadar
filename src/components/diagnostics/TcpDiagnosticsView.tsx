"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { probeTcpPort } from "@/lib/diagnostics/tcpClient";
import { saveHistoryItem } from "@/lib/storage/historyStore";
import { TcpCheckResult } from "@/types/diagnostics";
import { formatDuration } from "@/lib/utils/formatters";
import { Network, ShieldAlert, RefreshCw } from "lucide-react";

const COMMON_PORTS = [
  { port: 80, name: "HTTP" },
  { port: 443, name: "HTTPS" },
  { port: 22, name: "SSH" },
  { port: 53, name: "DNS (TCP)" },
  { port: 853, name: "DNS-over-TLS" },
];

export function TcpDiagnosticsView() {
  const [hostInput, setHostInput] = useState<string>("cloudflare.com");
  const [portInput, setPortInput] = useState<number>(443);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TcpCheckResult | null>(null);

  async function handleProbe() {
    if (!hostInput.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await probeTcpPort(hostInput.trim(), portInput);
      setResult(res);

      await saveHistoryItem({
        id: `tcp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        category: "tcp",
        target: `${res.host}:${res.port}`,
        startTime: res.timestamp - Math.round(res.durationMs),
        endTime: res.timestamp,
        durationMs: res.durationMs,
        status: res.status === "open" ? "success" : res.status === "forbidden" ? "warning" : "error",
        summary: `TCP Port ${res.port}: ${res.status.toUpperCase()} (${formatDuration(res.durationMs)})`,
        details: { tcp: res },
        errorMessage: res.message,
      });
    } catch (err) {
      console.error("TCP probe error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Network className="w-4 h-4 text-radar-teal" />
            TCP Port Connectivity & Handshake Probe
          </CardTitle>
          <Badge variant="cyan">Backend Handshake Layer</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-lg bg-radar-elevated/40 border border-radar-border text-xs text-radar-muted space-y-1.5">
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <ShieldAlert className="w-4 h-4 text-radar-cyan shrink-0" />
              <span>Browser Sandbox Architecture Notice</span>
            </div>
            <p>
              Standard Web Browser JavaScript in Safari, Chrome, and Firefox is fundamentally restricted from establishing arbitrary raw TCP sockets (<code className="text-radar-teal font-mono">new Socket()</code> is not a Web API).
            </p>
            <p className="text-slate-300">
              To provide legitimate Layer-4 TCP handshake diagnostics without fabricating numbers or confusing HTTP timing with TCP SYN/ACK, this probe executes via NetRadar&apos;s controlled backend Node.js socket agent with SSRF protection against RFC-1918 subnets.
            </p>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">Target Hostname or IP</label>
              <input
                type="text"
                value={hostInput}
                onChange={(e) => setHostInput(e.target.value)}
                placeholder="e.g. 1.1.1.1 or example.com"
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder:text-radar-subtle focus:outline-none focus:ring-1 focus:ring-radar-teal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">Port</label>
              <input
                type="number"
                min={1}
                max={65535}
                value={portInput}
                onChange={(e) => setPortInput(parseInt(e.target.value, 10) || 80)}
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-teal"
              />
            </div>
          </div>

          {/* Common Ports */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-radar-subtle font-mono">Common Services:</span>
            {COMMON_PORTS.map((item) => (
              <button
                key={item.port}
                onClick={() => setPortInput(item.port)}
                className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                  portInput === item.port
                    ? "bg-radar-elevated text-radar-teal border-radar-teal/40"
                    : "bg-radar-bg hover:bg-radar-elevated text-slate-300 border-radar-border"
                }`}
              >
                {item.name} ({item.port})
              </button>
            ))}
          </div>

          <div className="pt-2">
            <Button
              onClick={handleProbe}
              isLoading={isLoading}
              disabled={!hostInput.trim()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Test TCP Handshake
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result Display */}
      {result && (
        <Card glow={result.status === "open"}>
          <CardHeader>
            <CardTitle>
              <Network className="w-4 h-4 text-radar-teal" />
              TCP Handshake Report: <span className="font-mono text-white">{result.host}:{result.port}</span>
            </CardTitle>
            <Badge
              variant={
                result.status === "open"
                  ? "emerald"
                  : result.status === "forbidden"
                  ? "amber"
                  : "rose"
              }
            >
              PORT {result.status.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Handshake Duration</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {formatDuration(result.durationMs)}
                </span>
                <span className="text-[10px] text-radar-muted">TCP SYN/ACK</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Socket State</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block uppercase">
                  {result.status}
                </span>
                <span className="text-[10px] text-radar-muted">TCP Connection</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border col-span-2 sm:col-span-1">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Agent Environment</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block">
                  Node.js net.Socket
                </span>
                <span className="text-[10px] text-radar-muted">Backend Handshake</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-radar-bg border border-radar-border text-xs font-mono space-y-1">
              <span className="text-radar-subtle block font-sans text-[11px] uppercase">
                Diagnostic Trace Message:
              </span>
              <p className="text-slate-200">{result.message}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
