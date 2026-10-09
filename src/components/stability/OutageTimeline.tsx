"use client";

import React from "react";
import { OutageInterval } from "@/types/stability";
import { AlertTriangle, ShieldCheck, Clock, ArrowRight } from "lucide-react";

interface OutageTimelineProps {
  outages: OutageInterval[];
  totalSent: number;
}

export function OutageTimeline({ outages, totalSent }: OutageTimelineProps) {
  return (
    <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-4 sm:p-5 shadow-lg flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Outage & Degradation Timeline
          </h3>
          <p className="text-xs text-radar-subtle mt-0.5">
            Consecutive failure intervals, duration, and service recovery time
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-radar-bg border border-radar-border text-slate-300">
          {outages.length} {outages.length === 1 ? "Event" : "Events"}
        </span>
      </div>

      {outages.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center bg-radar-bg/40 border border-dashed border-radar-border rounded-lg">
          <ShieldCheck className="w-8 h-8 text-radar-teal mb-2" />
          <p className="text-sm font-medium text-slate-200">
            {totalSent > 0 ? "Zero Outages Detected" : "No Outages Recorded"}
          </p>
          <p className="text-xs text-radar-subtle max-w-sm mt-1">
            {totalSent > 0
              ? "All continuous probe samples completed without consecutive connection failures."
              : "Execute a stability probe to monitor consecutive outages and network drops."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {outages.map((outage, idx) => {
            const startDate = new Date(outage.startTime);
            const durationSec = outage.durationMs
              ? Math.max(0.1, Math.round((outage.durationMs / 1000) * 10) / 10)
              : null;
            const recoverySec = outage.recoveryTimeMs
              ? Math.round((outage.recoveryTimeMs / 1000) * 10) / 10
              : null;

            return (
              <div
                key={outage.id || idx}
                className="bg-radar-bg border border-radar-border/80 hover:border-red-500/40 rounded-lg p-3 transition-colors text-xs font-mono"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span className="font-semibold text-red-300">
                      Outage Event #{idx + 1}
                    </span>
                    <span className="text-radar-subtle text-[11px]">
                      {startDate.toLocaleTimeString()}
                    </span>
                  </div>

                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px]">
                    {outage.failedRequestsCount} consecutive failed{" "}
                    {outage.failedRequestsCount === 1 ? "probe" : "probes"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 bg-radar-surface/50 p-2 rounded">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-radar-teal shrink-0" />
                    <span>Outage Duration:</span>
                    <span className="text-slate-200 font-semibold">
                      {durationSec !== null ? `${durationSec}s` : "In progress"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3 text-radar-blue shrink-0" />
                    <span>Recovery Time:</span>
                    <span className="text-slate-200 font-semibold">
                      {recoverySec !== null ? `${recoverySec}s` : "Pending recovery"}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-radar-muted mt-1.5 truncate">
                  <span className="text-slate-400">Diagnosis:</span> {outage.reason}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
