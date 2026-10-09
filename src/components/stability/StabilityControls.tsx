"use client";

import React, { useState } from "react";
import {
  Play,
  Square,
  RotateCcw,
  Clock,
  Timer,
  Globe,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface StabilityControlsProps {
  isRunning: boolean;
  isPaused?: boolean;
  target: string;
  intervalMs: number;
  durationMinutes: number; // 0 = unlimited
  onTargetChange: (target: string) => void;
  onIntervalChange: (intervalMs: number) => void;
  onDurationChange: (minutes: number) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  hasData: boolean;
}

const PRESET_TARGETS = [
  { label: "Cloudflare Trace", url: "https://1.1.1.1/cdn-cgi/trace" },
  { label: "Cloudflare DoH", url: "https://cloudflare-dns.com/dns-query?name=cloudflare.com&type=A" },
  { label: "Google DNS", url: "https://dns.google/resolve?name=google.com&type=A" },
  { label: "Quad9 DoH", url: "https://dns.quad9.net/dns-query?name=quad9.net" },
];

const INTERVAL_OPTIONS = [
  { label: "500 ms (Fast)", value: 500 },
  { label: "1.0 s (Standard)", value: 1000 },
  { label: "2.0 s (Relaxed)", value: 2000 },
  { label: "5.0 s (Slow)", value: 5000 },
];

const DURATION_OPTIONS = [
  { label: "1 Min", value: 1 },
  { label: "5 Min", value: 5 },
  { label: "15 Min", value: 15 },
  { label: "30 Min", value: 30 },
  { label: "Continuous", value: 0 },
];

export function StabilityControls({
  isRunning,
  target,
  intervalMs,
  durationMinutes,
  onTargetChange,
  onIntervalChange,
  onDurationChange,
  onStart,
  onStop,
  onReset,
  onExportCsv,
  onExportJson,
  hasData,
}: StabilityControlsProps) {
  const [isCustomTarget, setIsCustomTarget] = useState(
    !PRESET_TARGETS.some((p) => p.url === target)
  );

  return (
    <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Target Selection & Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-radar-teal" />
            TARGET ENDPOINT (HTTP / HTTPS)
          </label>
          <span className="text-[11px] font-mono text-radar-subtle">
            {isRunning ? "Testing in progress" : "Configurable target"}
          </span>
        </div>

        {/* Preset quick buttons */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {PRESET_TARGETS.map((preset) => (
            <button
              key={preset.url}
              type="button"
              disabled={isRunning}
              onClick={() => {
                setIsCustomTarget(false);
                onTargetChange(preset.url);
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-mono border transition-all ${
                target === preset.url && !isCustomTarget
                  ? "bg-radar-teal/15 text-radar-teal border-radar-teal/50 shadow-sm"
                  : "bg-radar-bg text-slate-400 border-radar-border hover:border-slate-600 hover:text-slate-200"
              } ${isRunning ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setIsCustomTarget(true)}
            className={`px-2.5 py-1 text-xs rounded-md font-mono border transition-all ${
              isCustomTarget
                ? "bg-radar-teal/15 text-radar-teal border-radar-teal/50 shadow-sm"
                : "bg-radar-bg text-slate-400 border-radar-border hover:border-slate-600 hover:text-slate-200"
            } ${isRunning ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            Custom Target
          </button>
        </div>

        {/* Input box */}
        <div className="relative">
          <input
            type="url"
            value={target}
            disabled={isRunning}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="https://example.com/api/health"
            className="w-full bg-radar-bg border border-radar-border rounded-lg px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-radar-teal focus:ring-1 focus:ring-radar-teal disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Interval & Duration Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mb-1.5">
            <Timer className="w-3.5 h-3.5 text-radar-teal" />
            PROBE INTERVAL
          </label>
          <select
            value={intervalMs}
            disabled={isRunning}
            onChange={(e) => onIntervalChange(Number(e.target.value))}
            className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-radar-teal disabled:opacity-60"
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-radar-teal" />
            TEST DURATION
          </label>
          <select
            value={durationMinutes}
            disabled={isRunning}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-radar-teal disabled:opacity-60"
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Action Buttons & Export */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-radar-border/70">
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button
              onClick={onStart}
              className="bg-radar-teal hover:bg-radar-teal/90 text-slate-950 font-semibold px-4 py-2 text-xs sm:text-sm flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Stability Probe
            </Button>
          ) : (
            <Button
              onClick={onStop}
              variant="outline"
              className="border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold px-4 py-2 text-xs sm:text-sm flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop Test
            </Button>
          )}

          <Button
            onClick={onReset}
            variant="outline"
            disabled={isRunning || !hasData}
            className="border-radar-border hover:bg-radar-bg text-slate-400 hover:text-slate-200 text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            onClick={onExportCsv}
            variant="outline"
            disabled={!hasData}
            className="border-radar-border hover:bg-radar-bg text-slate-300 text-xs px-2.5 py-1.5 flex items-center gap-1 disabled:opacity-40"
            title="Export session data as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-radar-teal" />
            CSV
          </Button>
          <Button
            onClick={onExportJson}
            variant="outline"
            disabled={!hasData}
            className="border-radar-border hover:bg-radar-bg text-slate-300 text-xs px-2.5 py-1.5 flex items-center gap-1 disabled:opacity-40"
            title="Export session data as JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-radar-blue" />
            JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
