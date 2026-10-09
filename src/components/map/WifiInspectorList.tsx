"use client";

import React, { useState, useMemo } from "react";
import { WifiSurveyPoint } from "@/types/fieldMap";
import { getSignalRating } from "./signalUtils";
import { Wifi, Search, ChevronRight, ArrowUpDown } from "lucide-react";

interface WifiInspectorListProps {
  points: WifiSurveyPoint[];
  onSelectPoint: (point: WifiSurveyPoint) => void;
}

type BandFilter = "ALL" | "2.4 GHz" | "5 GHz" | "6 GHz";

export function WifiInspectorList({ points, onSelectPoint }: WifiInspectorListProps) {
  const [bandFilter, setBandFilter] = useState<BandFilter>("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rssi" | "time" | "ssid">("rssi");

  const filteredPoints = useMemo(() => {
    return points
      .filter((p) => {
        if (bandFilter !== "ALL" && p.band !== bandFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchSsid = p.ssid?.toLowerCase().includes(q);
          const matchLabel = p.label.toLowerCase().includes(q);
          const matchBssid = p.bssid?.toLowerCase().includes(q);
          return matchSsid || matchLabel || matchBssid;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "rssi") {
          return (b.rssi ?? -999) - (a.rssi ?? -999); // Strongest first
        }
        if (sortBy === "time") {
          return b.timestamp - a.timestamp;
        }
        return (a.ssid || a.label).localeCompare(b.ssid || b.label);
      });
  }, [points, bandFilter, search, sortBy]);

  return (
    <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-4 sm:p-5 shadow-lg flex flex-col">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-radar-teal" />
            Wi-Fi Inspector &amp; Survey Catalog
          </h3>
          <p className="text-xs text-radar-subtle mt-0.5">
            RF signal strengths, channel allocations, and spot test benchmarks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-radar-bg px-2 py-1 rounded-lg border border-radar-border text-xs font-mono text-slate-300">
            <ArrowUpDown className="w-3 h-3 text-radar-teal shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rssi" | "time" | "ssid")}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="rssi">Signal Strength</option>
              <option value="time">Latest First</option>
              <option value="ssid">SSID Name</option>
            </select>
          </div>

          {/* Band filter buttons */}
          <div className="flex items-center gap-1 bg-radar-bg p-1 rounded-lg border border-radar-border text-xs font-mono">
            {(["ALL", "2.4 GHz", "5 GHz", "6 GHz"] as BandFilter[]).map((bf) => (
              <button
                key={bf}
                type="button"
                onClick={() => setBandFilter(bf)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  bandFilter === bf
                    ? "bg-radar-teal/20 text-radar-teal font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {bf}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-40">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SSID / Room..."
              className="w-full bg-radar-bg border border-radar-border rounded-lg pl-8 pr-2.5 py-1 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-radar-teal"
            />
          </div>
        </div>
      </div>

      {/* Network List */}
      {filteredPoints.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-radar-subtle bg-radar-bg/40 border border-dashed border-radar-border rounded-lg">
          No surveyed Wi-Fi networks found matching criteria.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredPoints.map((point) => {
            const rating = getSignalRating(point.rssi);

            return (
              <div
                key={point.id}
                onClick={() => onSelectPoint(point)}
                className="bg-radar-bg border border-radar-border/80 hover:border-radar-teal/50 rounded-lg p-3 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs font-mono"
              >
                {/* Left: Signal Bars & SSID */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Visual Signal Indicator */}
                  <div className="flex items-end gap-0.5 h-6 shrink-0">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <div
                        key={bar}
                        className="w-1.5 rounded-xs"
                        style={{
                          height: `${bar * 4 + 4}px`,
                          backgroundColor: bar <= rating.bars ? rating.color : "#1E2D44",
                        }}
                      />
                    ))}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 truncate text-xs sm:text-sm">
                        {point.ssid || point.label}
                      </span>
                      {point.ssid && point.ssid !== point.label && (
                        <span className="text-[10px] text-radar-subtle truncate">
                          ({point.label})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-radar-subtle mt-1 flex-wrap">
                      <span className="bg-radar-surface px-1.5 py-0.2 rounded border border-radar-border text-slate-300">
                        {point.band || "Unknown Band"}
                      </span>
                      {point.channel && (
                        <span className="bg-radar-surface px-1.5 py-0.2 rounded border border-radar-border text-slate-300">
                          Ch {point.channel}
                        </span>
                      )}
                      {point.httpLatencyMs && (
                        <span className="text-radar-blue font-semibold">
                          {point.httpLatencyMs}ms ping
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {new Date(point.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: dBm badge & Arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="px-2 py-1 rounded text-center border font-bold text-xs"
                    style={{
                      borderColor: `${rating.color}60`,
                      color: rating.color,
                      backgroundColor: `${rating.color}15`,
                    }}
                  >
                    {point.rssi !== undefined ? `${point.rssi} dBm` : "N/A"}
                  </div>
                  <ChevronRight className="w-4 h-4 text-radar-subtle" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
