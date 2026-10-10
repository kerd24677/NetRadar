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
            placeholder="Hedef, özet veya kimlik ara..."
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
            <option value="all">Tüm Kategoriler</option>
            <option value="http">HTTP Probları</option>
            <option value="dns">DNS Sorguları</option>
            <option value="speed">Bant Genişliği</option>
            <option value="tcp">TCP Portları</option>
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
            <option value="all">Tüm Durumlar</option>
            <option value="success">Başarılı</option>
            <option value="warning">Uyarı / Opaque</option>
            <option value="error">Hata</option>
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
            <option value="newest">En Yeni Kayıt</option>
            <option value="oldest">En Eski Kayıt</option>
            <option value="duration">En Uzun Süre</option>
          </select>
        </div>
      </div>
    </div>
  );
}
