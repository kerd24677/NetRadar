"use client";

import React from "react";
import {
  AlertTriangle,
  Clock,
  Zap,
  TrendingDown,
  Layers,
  HelpCircle,
} from "lucide-react";
import { StabilitySessionStats } from "@/types/stability";

interface StabilityKpisProps {
  stats: StabilitySessionStats;
  isRunning: boolean;
}

export function StabilityKpis({ stats, isRunning }: StabilityKpisProps) {
  const isDegraded = stats.failureRatio > 0 && stats.failureRatio < 10;
  const isCritical = stats.failureRatio >= 10;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {/* 1. Mean & Median Latency */}
      <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-3 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-radar-subtle text-xs font-mono mb-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-radar-teal" />
            ORTALAMA GECİKME
          </span>
          {stats.completedCount > 0 && (
            <span className="text-[10px] text-slate-400">Med: {stats.medianLatency}ms</span>
          )}
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-slate-100 flex items-baseline gap-1">
            {stats.completedCount > 0 ? (
              <>
                {stats.meanLatency}
                <span className="text-xs font-normal text-radar-subtle">ms</span>
              </>
            ) : (
              "—"
            )}
          </div>
          <div className="text-[10px] font-mono text-radar-subtle mt-1 flex items-center justify-between">
            <span>Min: {stats.minLatency}ms</span>
            <span>Maks: {stats.maxLatency}ms</span>
          </div>
        </div>
      </div>

      {/* 2. 95th Percentile (p95) */}
      <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-3 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-radar-subtle text-xs font-mono mb-1">
          <span className="flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-radar-blue" />
            P95 GECİKME
          </span>
          <span className="text-[10px] text-slate-400">95. Yüzdelik</span>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-radar-blue flex items-baseline gap-1">
            {stats.completedCount > 0 ? (
              <>
                {stats.p95Latency}
                <span className="text-xs font-normal text-radar-subtle">ms</span>
              </>
            ) : (
              "—"
            )}
          </div>
          <div className="text-[10px] font-mono text-radar-subtle mt-1">
            {stats.completedCount > 0 ? "Kuyruk gecikmesi eşiği" : "Ölçüm bekleniyor"}
          </div>
        </div>
      </div>

      {/* 3. HTTP Failure Ratio (Explicitly not ICMP) */}
      <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-3 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-radar-subtle text-xs font-mono mb-1">
          <span className="flex items-center gap-1">
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                isCritical
                  ? "text-red-400"
                  : isDegraded
                  ? "text-amber-400"
                  : "text-radar-teal"
              }`}
            />
            HTTP BAŞARISIZLIK
          </span>
          <span
            title="Uygulama katmanı HTTP istek başarısızlık oranı. Modern web tarayıcıları doğrudan ICMP paket testi yapamaz."
            className="cursor-help"
          >
            <HelpCircle className="w-3 h-3 text-radar-subtle" />
          </span>
        </div>
        <div>
          <div
            className={`text-xl sm:text-2xl font-mono font-bold flex items-baseline gap-1 ${
              isCritical
                ? "text-red-400"
                : isDegraded
                ? "text-amber-400"
                : "text-radar-teal"
            }`}
          >
            {stats.totalSent > 0 ? (
              <>
                %{stats.failureRatio}
              </>
            ) : (
              "%0.0"
            )}
          </div>
          <div className="text-[10px] font-mono text-radar-subtle mt-1 truncate">
            {stats.totalSent} probdan {stats.failedCount} başarısız
          </div>
        </div>
      </div>

      {/* 4. RFC 3550 Jitter (App-Layer Delay Variance) */}
      <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-3 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-radar-subtle text-xs font-mono mb-1">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            SEĞİRME (RFC 3550)
          </span>
          <span
            title="RFC 3550 ortalama mutlak fark (MAD) formülüyle hesaplanan gecikme değişimi. Tarayıcı HTTP RTT dalgalanmasını modeller."
            className="cursor-help"
          >
            <HelpCircle className="w-3 h-3 text-radar-subtle" />
          </span>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400 flex items-baseline gap-1">
            {stats.completedCount > 1 ? (
              <>
                {stats.jitter}
                <span className="text-xs font-normal text-radar-subtle">ms</span>
              </>
            ) : (
              "—"
            )}
          </div>
          <div className="text-[10px] font-mono text-radar-subtle mt-1 truncate">
            Gecikme varyansı (MAD)
          </div>
        </div>
      </div>

      {/* 5. Outages Detected & Max Consecutive */}
      <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-radar-surface/90 border border-radar-border rounded-xl p-3 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-radar-subtle text-xs font-mono mb-1">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-radar-teal" />
            KESİNTİLER
          </span>
          {isRunning && (
            <span className="inline-flex items-center gap-1 text-[10px] text-radar-teal font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-radar-teal animate-pulse" />
              CANLI
            </span>
          )}
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-slate-100 flex items-baseline gap-1">
            {stats.outageCount}
            <span className="text-xs font-normal text-radar-subtle">olay</span>
          </div>
          <div className="text-[10px] font-mono text-radar-subtle mt-1">
            Maks ardışık hata: {stats.maxConsecutiveFailures}
          </div>
        </div>
      </div>
    </div>
  );
}
