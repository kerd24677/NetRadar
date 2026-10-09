"use client";

import React from "react";
import { HistoryFilter, TestCategory } from "@/types/history";
import { Search } from "lucide-react";

interface HistoryFilterBarProps {
  filter: HistoryFilter;
  onChange: (filter: HistoryFilter) => void;
}

export function HistoryFilterBar({ filter, onChange }: HistoryFilterBarProps) {
  return (
    <div className="bg-radar-surface p-3.5 sm:p-4 rounded-xl border border-radar-border space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-radar-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search target, summary, or ID..."
            value={filter.searchQuery || ""}
            onChange={(e) => onChange({ ...filter, searchQuery: e.target.value })}
            className="w-full bg-radar-bg border border-radar-border rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-radar-subtle focus:outline-none focus:ring-1 focus:ring-radar-teal"
          />
        </div>

        {/* Category Select */}
        <div className="sm:col-span-3">
          <select
            value={filter.category || "all"}
            onChange={(e) =>
              onChange({ ...filter, category: e.target.value as TestCategory | "all" })
            }
            className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-teal"
          >
            <option value="all">All Categories</option>
            <option value="http">HTTP Probes</option>
            <option value="dns">DNS Queries</option>
            <option value="speed">Throughput</option>
            <option value="tcp">TCP Ports</option>
          </select>
        </div>

        {/* Status Select */}
        <div className="sm:col-span-2">
          <select
            value={filter.status || "all"}
            onChange={(e) =>
              onChange({
                ...filter,
                status: e.target.value as "all" | "success" | "warning" | "error",
              })
            }
            className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-teal"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="warning">Warning / Opaque</option>
            <option value="error">Error</option>
          </select>
        </div>

        {/* Sort Select */}
        <div className="sm:col-span-2">
          <select
            value={filter.sortBy || "newest"}
            onChange={(e) =>
              onChange({
                ...filter,
                sortBy: e.target.value as "newest" | "oldest" | "duration",
              })
            }
            className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-teal"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="duration">Longest Duration</option>
          </select>
        </div>
      </div>
    </div>
  );
}
