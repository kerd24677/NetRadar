"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { StabilityProbePoint } from "@/types/stability";
import { BarChart3, AlertCircle } from "lucide-react";

interface StabilityChartProps {
  points: StabilityProbePoint[];
  p95Latency?: number;
}

type FilterRange = "30" | "100" | "all";

export function StabilityChart({ points, p95Latency }: StabilityChartProps) {
  const [range, setRange] = useState<FilterRange>("100");

  const filteredPoints = React.useMemo(() => {
    if (range === "30") return points.slice(-30);
    if (range === "100") return points.slice(-100);
    return points;
  }, [points, range]);

  const chartData = React.useMemo(() => {
    return filteredPoints.map((pt) => ({
      seq: pt.seq,
      time: new Date(pt.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      latency: pt.status === "success" ? Math.round(pt.durationMs * 10) / 10 : null,
      failedLatency: pt.status !== "success" ? 0 : null,
      status: pt.status,
      httpStatus: pt.httpStatus,
      errorDetails: pt.errorDetails,
    }));
  }, [filteredPoints]);

  return (
    <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-4 sm:p-5 shadow-lg flex flex-col">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-radar-teal" />
            Response Latency & Stability Timeline
          </h3>
          <p className="text-xs text-radar-subtle mt-0.5">
            Real HTTP round-trip timing with failure indicators
          </p>
        </div>

        {/* Range Tabs */}
        <div className="flex items-center gap-1 bg-radar-bg p-1 rounded-lg border border-radar-border text-xs font-mono">
          <button
            type="button"
            onClick={() => setRange("30")}
            className={`px-2.5 py-1 rounded transition-colors ${
              range === "30"
                ? "bg-radar-teal/20 text-radar-teal font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Last 30
          </button>
          <button
            type="button"
            onClick={() => setRange("100")}
            className={`px-2.5 py-1 rounded transition-colors ${
              range === "100"
                ? "bg-radar-teal/20 text-radar-teal font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Last 100
          </button>
          <button
            type="button"
            onClick={() => setRange("all")}
            className={`px-2.5 py-1 rounded transition-colors ${
              range === "all"
                ? "bg-radar-teal/20 text-radar-teal font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({points.length})
          </button>
        </div>
      </div>

      {/* Chart Canvas or Empty State */}
      {points.length === 0 ? (
        <div className="h-64 sm:h-72 flex flex-col items-center justify-center text-center p-6 bg-radar-bg/50 border border-dashed border-radar-border rounded-lg">
          <BarChart3 className="w-10 h-10 text-radar-subtle mb-2.5" />
          <p className="text-sm font-medium text-slate-300">No stability measurements yet</p>
          <p className="text-xs text-radar-muted max-w-sm mt-1">
            Start a stability probe above to observe genuine HTTP latency fluctuations, jitter variance, and outage events.
          </p>
        </div>
      ) : (
        <div className="h-64 sm:h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
              <XAxis
                dataKey="seq"
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                fontFamily="monospace"
                tickFormatter={(v) => `#${v}`}
              />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                fontFamily="monospace"
                unit="ms"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const isErr = data.status !== "success";
                    return (
                      <div className="bg-radar-surface/95 border border-radar-border p-3 rounded-lg shadow-xl text-xs font-mono backdrop-blur-md min-w-[190px]">
                        <div className="flex items-center justify-between border-b border-radar-border/80 pb-1 mb-1.5">
                          <span className="text-radar-subtle">Probe #{data.seq}</span>
                          <span className="text-[10px] text-slate-400">{data.time}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Duration:</span>
                            <span className="font-bold text-radar-teal">
                              {data.latency !== null ? `${data.latency} ms` : "Failed"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Status:</span>
                            <span
                              className={`font-semibold ${
                                isErr ? "text-red-400" : "text-emerald-400"
                              }`}
                            >
                              {data.status.toUpperCase()}
                            </span>
                          </div>
                          {data.httpStatus ? (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">HTTP Code:</span>
                              <span className="text-slate-200">{data.httpStatus}</span>
                            </div>
                          ) : null}
                          {data.errorDetails && (
                            <div className="text-[11px] text-red-300 pt-1 border-t border-radar-border/60">
                              {data.errorDetails}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {p95Latency && p95Latency > 0 && (
                <ReferenceLine
                  y={p95Latency}
                  stroke="#46A8FF"
                  strokeDasharray="4 4"
                  label={{
                    value: `p95 (${p95Latency}ms)`,
                    fill: "#46A8FF",
                    fontSize: 10,
                    position: "top",
                  }}
                />
              )}
              {/* Latency line for successful probes */}
              <Line
                type="monotone"
                dataKey="latency"
                stroke="#4DE0C1"
                strokeWidth={2}
                dot={{ r: 2, fill: "#4DE0C1" }}
                activeDot={{ r: 5, fill: "#4DE0C1", stroke: "#0B1220", strokeWidth: 2 }}
                connectNulls={false}
              />
              {/* Failure points indicator line */}
              <Line
                type="monotone"
                dataKey="failedLatency"
                stroke="#EF4444"
                strokeWidth={0}
                dot={{ r: 4, fill: "#EF4444", stroke: "#991B1B", strokeWidth: 1 }}
                activeDot={{ r: 6, fill: "#EF4444" }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend & Guide */}
      <div className="mt-3 pt-3 border-t border-radar-border/70 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-radar-subtle">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-radar-teal inline-block" />
            HTTP Latency (ms)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            Failure / Timeout
          </span>
          {p95Latency && p95Latency > 0 ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-radar-blue inline-block" />
              p95 Threshold ({p95Latency}ms)
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <AlertCircle className="w-3 h-3 text-radar-teal" />
          <span>Real browser fetch timing</span>
        </div>
      </div>
    </div>
  );
}
