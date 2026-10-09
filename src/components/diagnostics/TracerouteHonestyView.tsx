"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GitCommit, Terminal, AlertOctagon, CheckCircle2 } from "lucide-react";

export function TracerouteHonestyView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <GitCommit className="w-4 h-4 text-radar-teal" />
            ICMP Traceroute & Native Packet Loss Diagnostics
          </CardTitle>
          <Badge variant="rose">Sandbox Restricted</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-rose-200">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>Feature Disabled: Simulation Strictly Prohibited</span>
            </div>
            <p>
              In accordance with NetRadar&apos;s strict diagnostic integrity policies, this capability is permanently disabled rather than displaying fabricated or pseudo-simulated hop routes.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-radar-cyan" />
              Technical Root Cause & Protocol Constraints
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-radar-bg border border-radar-border space-y-2">
                <span className="font-semibold text-slate-200 block font-mono text-[11px] uppercase">
                  1. Browser Security Model (W3C/WHATWG)
                </span>
                <p className="text-radar-muted leading-relaxed">
                  Web browsers (including Safari on iOS, Chrome, and Firefox) strictly confine JavaScript execution to a high-level application sandbox. Web APIs expose only HTTP fetch, WebSockets, and WebRTC data channels.
                </p>
                <p className="text-radar-subtle">
                  Browsers provide no primitive to forge IP headers, manipulate TTL (Time-To-Live) packet fields, or capture raw ICMP Type 11 (Time Exceeded) replies.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-radar-bg border border-radar-border space-y-2">
                <span className="font-semibold text-slate-200 block font-mono text-[11px] uppercase">
                  2. Cloud Serverless Runtimes (Vercel / Lambda)
                </span>
                <p className="text-radar-muted leading-relaxed">
                  Serverless hosting architectures execute inside locked-down microVMs (e.g. AWS Firecracker / V8 Isolates) where Linux kernel capabilities such as <code className="text-radar-teal font-mono">CAP_NET_RAW</code> are dropped.
                </p>
                <p className="text-radar-subtle">
                  Creating a <code className="text-radar-teal font-mono">socket(AF_INET, SOCK_RAW, IPPROTO_ICMP)</code> raises <code className="text-rose-400 font-mono">EPERM</code> (Operation not permitted).
                </p>
              </div>
            </div>
          </div>

          {/* Architecture comparison */}
          <div className="p-4 rounded-lg bg-radar-bg border border-radar-border space-y-3">
            <span className="text-xs font-semibold text-slate-200 block">
              What NetRadar Delivers Instead
            </span>
            <ul className="space-y-2 text-xs text-radar-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-radar-teal shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Genuine HTTP Latency:</strong> Real application-layer round-trip timing with millisecond resolution via <code className="text-radar-teal font-mono">performance.now()</code>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-radar-teal shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">DNS-over-HTTPS (DoH):</strong> Authentic RFC-standard DNS record lookup and latency against worldwide recursive resolvers.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-radar-teal shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">TCP Handshake Probes:</strong> Genuine Layer-4 TCP SYN/ACK timing via NetRadar&apos;s protected backend runtime.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
