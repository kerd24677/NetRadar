"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { HistoryItem } from "@/types/history";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";

interface LatencyChartCardProps {
  historyItems: HistoryItem[];
}

export function LatencyChartCard({ historyItems }: LatencyChartCardProps) {
  // Filter items that have duration measurements and sort chronologically
  const chartData = historyItems
    .filter((item) => item.durationMs > 0)
    .slice(0, 15)
    .reverse()
    .map((item, index) => ({
      index: index + 1,
      name: item.target.length > 15 ? item.target.substring(0, 14) + "…" : item.target,
      fullTarget: item.target,
      category: item.category.toUpperCase(),
      latency: Math.round(item.durationMs * 10) / 10,
      time: new Date(item.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <BarChart3 className="w-4 h-4 text-radar-teal" />
          Response Latency Trend (ms)
        </CardTitle>
        <span className="text-xs font-mono text-radar-subtle">
          {chartData.length > 0 ? `${chartData.length} Recent Tests` : "Real Data Only"}
        </span>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-48 sm:h-56 flex flex-col items-center justify-center text-center p-4 rounded-lg bg-radar-bg border border-dashed border-radar-border">
            <BarChart3 className="w-8 h-8 text-radar-subtle mb-2" />
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              No genuine measurements recorded yet
            </p>
            <p className="text-xs text-radar-muted max-w-xs mt-1">
              NetRadar never fabricates or simulates telemetry data. Run a diagnostic probe to begin graphing real response times.
            </p>
          </div>
        ) : (
          <div className="h-48 sm:h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="monospace"
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
                      return (
                        <div className="bg-radar-surface border border-radar-border p-2.5 rounded-lg shadow-xl text-xs font-mono space-y-1">
                          <p className="text-radar-teal font-semibold">{data.fullTarget}</p>
                          <p className="text-slate-300">
                            Latency: <strong className="text-white">{data.latency} ms</strong>
                          </p>
                          <p className="text-radar-muted">Type: {data.category} | {data.time}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#4DE0C1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#4DE0C1" }}
                  activeDot={{ r: 5, fill: "#6FFFD9" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
