"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldX } from "lucide-react";

export function NativeHardwareNoticeCard() {
  const restrictedMetrics = [
    {
      metric: "Wi-Fi Signal Strength (RSSI / dBm)",
      reason: "Requires CoreWLAN / NetworkExtension entitlement. WebKit strictly forbids hardware RF access to prevent indoor geolocation tracking.",
    },
    {
      metric: "Access Point BSSID & Channel",
      reason: "BSSID constitutes a global geographic identifier; Apple blocks access without active Location Services permissions and native entitlements.",
    },
    {
      metric: "Cellular RSRP / RSRQ / Tower ID",
      reason: "CoreTelephony baseband diagnostics are reserved exclusively for signed native iOS carrier bundles.",
    },
    {
      metric: "Kernel Routing Table & ARP Cache",
      reason: "Web sandbox does not grant access to sysctl / procfs networking sockets or raw interface ARP resolution.",
    },
    {
      metric: "Raw Packet Capture (PCAP)",
      reason: "Requires raw BPF (Berkeley Packet Filter) devices; impossible from browser execution contexts.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <ShieldX className="w-4 h-4 text-radar-amber" />
          Native Mobile OS Sandbox Boundaries (iOS Safari & WebKit)
        </CardTitle>
        <Badge variant="amber">Strict Platform Isolation</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-radar-muted leading-relaxed">
          As a professional diagnostics platform, NetRadar provides total architectural transparency. The following low-level telecommunication parameters are structurally inaccessible to web applications by operating system design:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {restrictedMetrics.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-radar-bg border border-radar-border space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-radar-amber shrink-0" />
                <span className="text-xs font-semibold text-slate-200">{item.metric}</span>
              </div>
              <p className="text-[11px] text-radar-subtle leading-relaxed pl-3.5">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
