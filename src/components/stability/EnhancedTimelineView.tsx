"use client";

import React, { useState, useMemo } from "react";
import { OutageInterval, StabilityProbePoint } from "@/types/stability";
import {
  ShieldCheck,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EnhancedTimelineViewProps {
  outages: OutageInterval[];
  points: StabilityProbePoint[];
  totalSent: number;
}

type TimelineFilter = "all" | "outages" | "spikes" | "success";

export function EnhancedTimelineView({
  outages,
  points,
  totalSent,
}: EnhancedTimelineViewProps) {
  const [filter, setFilter] = useState<TimelineFilter>("all");

  // Extract significant events (outages + latency spikes > 150ms)
  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string;
      timestamp: number;
      type: "outage" | "spike" | "error" | "normal";
      label: string;
      durationMs?: number;
      recoveryMs?: number;
      details: string;
      color: string;
    }> = [];

    // 1. Add Outages
    outages.forEach((outage, idx) => {
      events.push({
        id: outage.id || `outage_${idx}`,
        timestamp: outage.startTime,
        type: "outage",
        label: `Hizmet Kesintisi #${idx + 1}`,
        durationMs: outage.durationMs,
        recoveryMs: outage.recoveryTimeMs,
        details: `${outage.failedRequestsCount} ardışık başarısız istek • ${outage.reason}`,
        color: "#FF2E93",
      });
    });

    // 2. Add Spikes (>150ms) from points
    points.forEach((pt) => {
      if (pt.status !== "success") {
        events.push({
          id: `err_${pt.id || pt.seq}`,
          timestamp: pt.timestamp,
          type: "error",
          label: `HTTP Başarısızlık (#${pt.seq})`,
          durationMs: pt.durationMs,
          details: pt.errorDetails || "Ağ hatası veya zaman aşımı",
          color: "#F43F5E",
        });
      } else if (pt.durationMs > 150) {
        events.push({
          id: `spike_${pt.id || pt.seq}`,
          timestamp: pt.timestamp,
          type: "spike",
          label: `Gecikme Sıçraması (${Math.round(pt.durationMs)}ms)`,
          durationMs: pt.durationMs,
          details: `#${pt.seq} numaralı istekte normalin üzerinde RTT tespit edildi`,
          color: "#F59E0B",
        });
      }
    });

    // Sort newest first
    events.sort((a, b) => b.timestamp - a.timestamp);

    if (filter === "outages") {
      return events.filter((e) => e.type === "outage");
    }
    if (filter === "spikes") {
      return events.filter((e) => e.type === "spike");
    }
    if (filter === "success") {
      return events.filter((e) => e.type === "normal");
    }

    return events;
  }, [outages, points, filter]);

  return (
    <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-4 sm:p-5 shadow-noc-card space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-radar-teal" />
            GELİŞMİŞ ÖLÇÜM VE KESİNTİ ZAMAN ÇİZELGESİ
          </h3>
          <p className="text-xs text-radar-subtle mt-0.5">
            Ardışık hata aralıkları, toparlanma süreleri ve mikro-gecikme sıçramaları
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-radar-bg p-1 rounded-lg border border-radar-border text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded transition-colors",
              filter === "all"
                ? "bg-radar-teal/20 text-radar-teal font-bold"
                : "text-slate-400 hover:text-white"
            )}
          >
            Tümü ({timelineEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("outages")}
            className={cn(
              "px-2.5 py-1 rounded transition-colors",
              filter === "outages"
                ? "bg-radar-teal/20 text-radar-teal font-bold"
                : "text-slate-400 hover:text-white"
            )}
          >
            Kesintiler ({outages.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("spikes")}
            className={cn(
              "px-2.5 py-1 rounded transition-colors",
              filter === "spikes"
                ? "bg-radar-teal/20 text-radar-teal font-bold"
                : "text-slate-400 hover:text-white"
            )}
          >
            Sıçramalar (&gt;150ms)
          </button>
        </div>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center bg-radar-bg/40 border border-dashed border-radar-border rounded-lg">
          <ShieldCheck className="w-8 h-8 text-radar-teal mb-2" />
          <p className="text-sm font-medium text-slate-200">
            {totalSent > 0 ? "Sıfır Kesinti / Kararlı Bağlantı" : "Henüz Kayıt Yok"}
          </p>
          <p className="text-xs text-radar-subtle max-w-sm mt-1">
            {totalSent > 0
              ? "Tüm prob istekleri bağlantı kopması veya kritik sıçrama olmadan tamamlandı."
              : "Bağlantı kararlılığını izlemek için ölçümü başlatın."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {timelineEvents.map((evt) => {
            const date = new Date(evt.timestamp);
            const durationSec = evt.durationMs
              ? Math.max(0.1, Math.round((evt.durationMs / 1000) * 10) / 10)
              : null;
            const recoverySec = evt.recoveryMs
              ? Math.round((evt.recoveryMs / 1000) * 10) / 10
              : null;

            return (
              <div
                key={evt.id}
                className="bg-radar-bg border border-radar-border/80 hover:border-radar-teal/40 rounded-lg p-3 transition-colors text-xs font-mono"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{
                        backgroundColor: evt.color,
                        boxShadow: `0 0 6px ${evt.color}`,
                      }}
                    />
                    <span className="font-bold text-white">{evt.label}</span>
                    <span className="text-radar-subtle text-[11px]">
                      {date.toLocaleTimeString()}
                    </span>
                  </div>

                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${evt.color}22`,
                      color: evt.color,
                      border: `1px solid ${evt.color}44`,
                    }}
                  >
                    {evt.type === "outage"
                      ? "KRİTİK KESİNTİ"
                      : evt.type === "spike"
                      ? "RTT SIÇRAMASI"
                      : "HTTP HATASI"}
                  </span>
                </div>

                {evt.type === "outage" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 bg-radar-surface/50 p-2 rounded mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-radar-teal shrink-0" />
                      <span>Kesinti Süresi:</span>
                      <span className="text-slate-200 font-bold">
                        {durationSec !== null ? `${durationSec} sn` : "Devam ediyor"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-radar-cyan shrink-0" />
                      <span>Toparlanma Süresi:</span>
                      <span className="text-slate-200 font-bold">
                        {recoverySec !== null ? `${recoverySec} sn` : "Bekleniyor"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-radar-muted truncate">
                  <span className="text-slate-400 font-semibold">Teşhis:</span>{" "}
                  {evt.details}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
