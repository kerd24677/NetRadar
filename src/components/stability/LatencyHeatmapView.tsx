"use client";

import React, { useState, useMemo } from "react";
import { StabilityProbePoint } from "@/types/stability";
import {
  Grid,
  Activity,
  Flame,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LatencyHeatmapViewProps {
  points: StabilityProbePoint[];
}

interface TierDefinition {
  id: string;
  label: string;
  color: string;
  glow: string;
  bgRgba: string;
  check: (p: StabilityProbePoint) => boolean;
}

const TIERS: TierDefinition[] = [
  {
    id: "error",
    label: "Hata / Zaman Aşımı",
    color: "#FF2E93",
    glow: "rgba(255, 46, 147, 0.8)",
    bgRgba: "rgba(255, 46, 147, 0.4)",
    check: (p) => p.status !== "success",
  },
  {
    id: "tier_high",
    label: "> 200 ms (Kritik Spike)",
    color: "#F43F5E",
    glow: "rgba(244, 63, 94, 0.8)",
    bgRgba: "rgba(244, 63, 94, 0.35)",
    check: (p) => p.status === "success" && p.durationMs > 200,
  },
  {
    id: "tier_med_high",
    label: "100 - 200 ms (Orta Gecikme)",
    color: "#F59E0B",
    glow: "rgba(245, 158, 11, 0.8)",
    bgRgba: "rgba(245, 158, 11, 0.3)",
    check: (p) => p.status === "success" && p.durationMs > 100 && p.durationMs <= 200,
  },
  {
    id: "tier_med_low",
    label: "50 - 100 ms (İyi)",
    color: "#00F0FF",
    glow: "rgba(0, 240, 255, 0.8)",
    bgRgba: "rgba(0, 240, 255, 0.25)",
    check: (p) => p.status === "success" && p.durationMs > 50 && p.durationMs <= 100,
  },
  {
    id: "tier_low",
    label: "< 50 ms (Düşük / İdeal)",
    color: "#10B981",
    glow: "rgba(16, 185, 129, 0.8)",
    bgRgba: "rgba(16, 185, 129, 0.3)",
    check: (p) => p.status === "success" && p.durationMs <= 50,
  },
];

export function LatencyHeatmapView({ points }: LatencyHeatmapViewProps) {
  const [viewMode, setViewMode] = useState<"matrix" | "blocks">("matrix");
  const [selectedCell, setSelectedCell] = useState<{
    tierLabel: string;
    count: number;
    timeRange: string;
    points: StabilityProbePoint[];
  } | null>(null);

  // Bucket points into 20 chronological time columns
  const numColumns = 20;

  const matrixData = useMemo(() => {
    if (points.length === 0) return { columns: [], maxCountInCell: 0, spikeCount: 0 };

    const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
    const minTime = sorted[0].timestamp;
    const maxTime = sorted[sorted.length - 1].timestamp;
    const timeSpan = Math.max(1000, maxTime - minTime);
    const bucketDuration = timeSpan / numColumns;

    const columns: Array<{
      colIndex: number;
      startTime: number;
      endTime: number;
      counts: Record<string, number>;
      pointsInTier: Record<string, StabilityProbePoint[]>;
    }> = [];

    for (let c = 0; c < numColumns; c++) {
      columns.push({
        colIndex: c,
        startTime: minTime + c * bucketDuration,
        endTime: minTime + (c + 1) * bucketDuration,
        counts: {
          error: 0,
          tier_high: 0,
          tier_med_high: 0,
          tier_med_low: 0,
          tier_low: 0,
        },
        pointsInTier: {
          error: [],
          tier_high: [],
          tier_med_high: [],
          tier_med_low: [],
          tier_low: [],
        },
      });
    }

    let maxCount = 0;
    let spikeCount = 0;

    sorted.forEach((p) => {
      let colIdx = Math.floor((p.timestamp - minTime) / bucketDuration);
      if (colIdx >= numColumns) colIdx = numColumns - 1;
      if (colIdx < 0) colIdx = 0;

      const col = columns[colIdx];

      for (const tier of TIERS) {
        if (tier.check(p)) {
          col.counts[tier.id] = (col.counts[tier.id] || 0) + 1;
          col.pointsInTier[tier.id].push(p);
          if (col.counts[tier.id] > maxCount) {
            maxCount = col.counts[tier.id];
          }
          if (tier.id === "tier_high" || tier.id === "error") {
            spikeCount++;
          }
          break;
        }
      }
    });

    return { columns, maxCountInCell: Math.max(1, maxCount), spikeCount };
  }, [points, numColumns]);

  return (
    <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-4 sm:p-5 shadow-noc-card space-y-4">
      {/* Header and Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-radar-elevated border border-radar-cyan/30 flex items-center justify-center text-radar-cyan shadow-noc-glow-cyan">
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              GECİKME VE HATA ISI HARİTASI
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-radar-elevated text-radar-cyan border border-radar-border">
                {points.length} ÖRNEK
              </span>
            </h3>
            <p className="text-xs text-radar-subtle mt-0.5">
              Zaman dilimlerine göre gecikme dağılım yoğunluğu ve HTTP hata öbekleri
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-radar-bg rounded-lg border border-radar-border p-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => setViewMode("matrix")}
            className={cn(
              "px-2.5 py-1 rounded transition-colors flex items-center gap-1.5",
              viewMode === "matrix"
                ? "bg-radar-cyan/20 text-radar-cyan font-bold"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Grid className="w-3 h-3" />
            Matris Izgarası
          </button>
          <button
            type="button"
            onClick={() => setViewMode("blocks")}
            className={cn(
              "px-2.5 py-1 rounded transition-colors flex items-center gap-1.5",
              viewMode === "blocks"
                ? "bg-radar-cyan/20 text-radar-cyan font-bold"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Layers className="w-3 h-3" />
            Dağılım Akışı
          </button>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center bg-radar-bg/40 rounded-xl border border-dashed border-radar-border">
          <Activity className="w-8 h-8 text-radar-subtle mb-2" />
          <p className="text-sm font-medium text-slate-300">Isı Haritası Verisi Bulunmuyor</p>
          <p className="text-xs text-radar-subtle mt-1 max-w-sm">
            Isı haritasını doldurmak için yukarıdan Kararlılık Ölçümünü başlatın.
          </p>
        </div>
      ) : (
        <>
          {/* Main Matrix Grid View */}
          {viewMode === "matrix" ? (
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[580px] space-y-2">
                {TIERS.map((tier) => (
                  <div key={tier.id} className="flex items-center gap-2">
                    {/* Y-Axis Label */}
                    <div className="w-40 sm:w-48 text-[11px] font-mono text-slate-300 flex items-center justify-between shrink-0 pr-2">
                      <span className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: tier.color, boxShadow: `0 0 6px ${tier.color}` }}
                        />
                        <span className="truncate">{tier.label}</span>
                      </span>
                    </div>

                    {/* Heatmap Row Cells */}
                    <div className="flex-1 grid grid-cols-20 gap-1 h-8">
                      {matrixData.columns.map((col) => {
                        const count = col.counts[tier.id] || 0;
                        const opacity =
                          count > 0
                            ? Math.min(1, 0.25 + (count / matrixData.maxCountInCell) * 0.75)
                            : 0.05;

                        return (
                          <div
                            key={`cell_${tier.id}_${col.colIndex}`}
                            onClick={() => {
                              if (count > 0) {
                                setSelectedCell({
                                  tierLabel: tier.label,
                                  count,
                                  timeRange: `${new Date(col.startTime).toLocaleTimeString()} - ${new Date(
                                    col.endTime
                                  ).toLocaleTimeString()}`,
                                  points: col.pointsInTier[tier.id],
                                });
                              }
                            }}
                            className={cn(
                              "h-full rounded transition-all duration-150 cursor-pointer relative group",
                              count > 0 ? "hover:scale-110 hover:z-20 border border-white/20" : ""
                            )}
                            style={{
                              backgroundColor: count > 0 ? tier.color : "rgba(255,255,255,0.03)",
                              opacity,
                              boxShadow: count > 0 ? `0 0 8px ${tier.color}88` : "none",
                            }}
                            title={`${tier.label}: ${count} istek (${new Date(col.startTime).toLocaleTimeString()})`}
                          >
                            {count > 0 && (
                              <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold text-black drop-shadow">
                                {count}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* X-Axis Time Legend */}
                <div className="flex items-center gap-2 pt-2 border-t border-radar-border/60">
                  <div className="w-40 sm:w-48 text-[10px] font-mono text-radar-subtle shrink-0">
                    ZAMAN AKIŞI →
                  </div>
                  <div className="flex-1 flex justify-between text-[10px] font-mono text-radar-subtle px-1">
                    <span>
                      {matrixData.columns[0]
                        ? new Date(matrixData.columns[0].startTime).toLocaleTimeString()
                        : "00:00"}
                    </span>
                    <span>
                      {matrixData.columns[Math.floor(numColumns / 2)]
                        ? new Date(
                            matrixData.columns[Math.floor(numColumns / 2)].startTime
                          ).toLocaleTimeString()
                        : "00:00"}
                    </span>
                    <span>
                      {matrixData.columns[numColumns - 1]
                        ? new Date(
                            matrixData.columns[numColumns - 1].endTime
                          ).toLocaleTimeString()
                        : "00:00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Sequential Block View (Stream of discrete samples) */
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1 p-2 bg-radar-bg rounded-lg border border-radar-border max-h-56 overflow-y-auto">
                {points.slice(-120).map((pt, idx) => {
                  const isErr = pt.status !== "success";
                  const color = isErr
                    ? "#FF2E93"
                    : pt.durationMs > 200
                    ? "#F43F5E"
                    : pt.durationMs > 100
                    ? "#F59E0B"
                    : pt.durationMs > 50
                    ? "#00F0FF"
                    : "#10B981";

                  return (
                    <div
                      key={`stream_${pt.id || idx}`}
                      className="w-4 h-6 rounded-sm transition-transform hover:scale-125 cursor-pointer relative"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 5px ${color}88`,
                      }}
                      title={`#${pt.seq}: ${
                        isErr ? "Hata" : `${Math.round(pt.durationMs)}ms`
                      } (${new Date(pt.timestamp).toLocaleTimeString()})`}
                    />
                  );
                })}
              </div>
              <p className="text-[11px] font-mono text-radar-subtle">
                Son 120 ardışık prob örneği. Her blok sırayla gönderilen bir HTTP isteğini temsil eder.
              </p>
            </div>
          )}

          {/* Selected Cell Inspection Card */}
          {selectedCell && (
            <div className="p-3 bg-radar-bg rounded-lg border border-radar-cyan/40 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-radar-cyan animate-pulse" />
                <div>
                  <span className="font-bold text-white">{selectedCell.tierLabel}</span>
                  <span className="text-radar-subtle ml-2">({selectedCell.timeRange})</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-radar-cyan font-bold">
                  {selectedCell.count} İstek Kaydı
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="text-radar-subtle hover:text-white px-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
