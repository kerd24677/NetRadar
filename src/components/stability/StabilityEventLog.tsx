"use client";

import React, { useState, useMemo } from "react";
import { StabilityProbePoint } from "@/types/stability";
import { ListFilter, Search } from "lucide-react";

interface StabilityEventLogProps {
  points: StabilityProbePoint[];
  p95Latency?: number;
}

type EventFilter = "all" | "errors" | "slow";

export function StabilityEventLog({ points, p95Latency = 0 }: StabilityEventLogProps) {
  const [filter, setFilter] = useState<EventFilter>("all");
  const [search, setSearch] = useState("");

  const filteredPoints = useMemo(() => {
    return [...points].reverse().filter((p) => {
      // Category filter
      if (filter === "errors" && p.status === "success") return false;
      if (filter === "slow" && (p.status !== "success" || p.durationMs <= p95Latency)) return false;

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTarget = p.target.toLowerCase().includes(q);
        const matchesError = p.errorDetails?.toLowerCase().includes(q);
        const matchesSeq = p.seq.toString().includes(q);
        return matchesTarget || matchesError || matchesSeq;
      }

      return true;
    });
  }, [points, filter, search, p95Latency]);

  return (
    <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-4 sm:p-5 shadow-lg flex flex-col">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-radar-teal" />
            Probe Event Log
          </h3>
          <p className="text-xs text-radar-subtle mt-0.5">
            Detailed chronological record of individual HTTP requests
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-radar-bg p-1 rounded-lg border border-radar-border text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === "all"
                  ? "bg-radar-teal/20 text-radar-teal font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({points.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("errors")}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === "errors"
                  ? "bg-red-500/20 text-red-400 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Errors ({points.filter((p) => p.status !== "success").length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("slow")}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === "slow"
                  ? "bg-amber-500/20 text-amber-400 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Slow &gt; p95
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:w-36">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-radar-bg border border-radar-border rounded-lg pl-8 pr-2.5 py-1 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-radar-teal"
            />
          </div>
        </div>
      </div>

      {/* Table / List */}
      {filteredPoints.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-radar-subtle bg-radar-bg/40 border border-dashed border-radar-border rounded-lg">
          No probe events match the current criteria.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-80 overflow-y-auto border border-radar-border/80 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-radar-bg/90 text-radar-subtle sticky top-0 border-b border-radar-border">
              <tr>
                <th className="px-3 py-2">#Seq</th>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Latency</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">HTTP</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-radar-border/50">
              {filteredPoints.map((pt) => {
                const isErr = pt.status !== "success";
                const isSlow = pt.status === "success" && p95Latency > 0 && pt.durationMs >= p95Latency;

                return (
                  <tr
                    key={pt.id}
                    className={`hover:bg-radar-bg/70 transition-colors ${
                      isErr ? "bg-red-500/5" : isSlow ? "bg-amber-500/5" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-semibold text-slate-300">#{pt.seq}</td>
                    <td className="px-3 py-2 text-radar-subtle">
                      {new Date(pt.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2">
                      {pt.status === "success" ? (
                        <span
                          className={
                            isSlow ? "text-amber-400 font-bold" : "text-radar-teal font-medium"
                          }
                        >
                          {pt.durationMs} ms
                        </span>
                      ) : (
                        <span className="text-red-400">Failed</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                          isErr
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {pt.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {pt.httpStatus !== undefined && pt.httpStatus !== 0 ? pt.httpStatus : "—"}
                    </td>
                    <td className="px-3 py-2 text-radar-subtle truncate max-w-xs" title={pt.errorDetails}>
                      {pt.errorDetails || "HTTP 200 OK / Completed"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
