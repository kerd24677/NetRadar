"use client";

import React, { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { HttpDiagnosticsView } from "@/components/diagnostics/HttpDiagnosticsView";
import { DnsDiagnosticsView } from "@/components/diagnostics/DnsDiagnosticsView";
import { ThroughputDiagnosticsView } from "@/components/diagnostics/ThroughputDiagnosticsView";
import { TcpDiagnosticsView } from "@/components/diagnostics/TcpDiagnosticsView";
import { TracerouteHonestyView } from "@/components/diagnostics/TracerouteHonestyView";
import { Globe, Server, Gauge, Network, GitCommit, Activity } from "lucide-react";

export default function DiagnosticsPage() {
  const [activeTab, setActiveTab] = useState<string>("http");

  const tabs = [
    { id: "http", label: "HTTP / HTTPS", icon: <Globe className="w-4 h-4" />, badge: "Continuous & Matrix" },
    { id: "dns", label: "DNS (DoH)", icon: <Server className="w-4 h-4" />, badge: "Multi-Resolver" },
    { id: "throughput", label: "Throughput", icon: <Gauge className="w-4 h-4" />, badge: "Up & Down" },
    { id: "tcp", label: "TCP Port Matrix", icon: <Network className="w-4 h-4" />, badge: "10-Port Scan" },
    { id: "traceroute", label: "Traceroute (Limits)", icon: <GitCommit className="w-4 h-4" />, badge: "Sandbox Policy" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-radar-teal" />
            Network Diagnostics Suite
          </h1>
          <p className="text-xs sm:text-sm text-radar-muted mt-1">
            Enterprise network telemetry probes: continuous streaming, multi-resolver benchmarks, and port matrix analysis.
          </p>
        </div>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-4">
        {activeTab === "http" && <HttpDiagnosticsView />}
        {activeTab === "dns" && <DnsDiagnosticsView />}
        {activeTab === "throughput" && <ThroughputDiagnosticsView />}
        {activeTab === "tcp" && <TcpDiagnosticsView />}
        {activeTab === "traceroute" && <TracerouteHonestyView />}
      </div>
    </div>
  );
}
