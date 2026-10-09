"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ConnectionStatusCard } from "@/components/dashboard/ConnectionStatusCard";
import { QuickDiagnosticsCard } from "@/components/dashboard/QuickDiagnosticsCard";
import { LatencyChartCard } from "@/components/dashboard/LatencyChartCard";
import { RecentHistoryCard } from "@/components/dashboard/RecentHistoryCard";
import { getAllHistory } from "@/lib/storage/historyStore";
import { HistoryItem } from "@/types/history";
import { ShieldCheck, HardDrive, Radio, Layers } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function OverviewPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [successRate, setSuccessRate] = useState<number>(100);

  const loadHistory = useCallback(async () => {
    try {
      const items = await getAllHistory({ sortBy: "newest" });
      setHistoryItems(items);
      setTotalCount(items.length);

      if (items.length > 0) {
        const successes = items.filter((i) => i.status === "success").length;
        setSuccessRate(Math.round((successes / items.length) * 100));
      }
    } catch (err) {
      console.warn("Failed to load history in overview:", err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="space-y-6">
      {/* Overview Header & Top KPI ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-radar-teal animate-pulse-teal" />
            Network Operations Console
          </h1>
          <p className="text-xs sm:text-sm text-radar-muted mt-1">
            Real-time diagnostic telemetry, DoH resolvers, and local client measurements.
          </p>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3.5 sm:p-4 bg-radar-surface/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-radar-elevated border border-radar-teal/30 flex items-center justify-center text-radar-teal">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-radar-subtle block">
                Total Tests
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-white">
                {totalCount}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-radar-surface/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-radar-elevated border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-radar-subtle block">
                Success Rate
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-white">
                {totalCount > 0 ? `${successRate}%` : "—"}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-radar-surface/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-radar-elevated border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-radar-subtle block">
                Local Vault
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-white">
                IndexedDB
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-radar-surface/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-radar-elevated border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-radar-subtle block">
                Resolver
              </span>
              <span className="text-sm font-semibold font-mono text-white truncate max-w-[120px]">
                DoH Active
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Telemetry Status + Quick Probe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConnectionStatusCard />
        <QuickDiagnosticsCard onTestComplete={loadHistory} />
      </div>

      {/* Secondary Grid: Latency Chart + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatencyChartCard historyItems={historyItems} />
        <RecentHistoryCard items={historyItems} />
      </div>
    </div>
  );
}
