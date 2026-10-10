"use client";

import React, { useState, useMemo } from "react";
import { WifiSurveyPoint } from "@/types/fieldMap";
import { getSignalRating } from "./signalUtils";
import { Wifi, Search, ChevronRight, ArrowUpDown } from "lucide-react";

interface WifiInspectorListProps {
  points: WifiSurveyPoint[];
  onSelectPoint: (point: WifiSurveyPoint) => void;
}

type BandFilter = "TÜMÜ" | "2.4 GHz" | "5 GHz" | "6 GHz";

export function WifiInspectorList({ points, onSelectPoint }: WifiInspectorListProps) {
  const [bandFilter, setBandFilter] = useState<BandFilter>("TÜMÜ");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rssi" | "time" | "ssid">("rssi");

  const filteredPoints = useMemo(() => {
    return points
      .filter((p) => {
        if (bandFilter !== "TÜMÜ" && p.band !== bandFilter) return false;
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
          return (b.rssi ?? -999) - (a.rssi ?? -999);
        }
        if (sortBy === "time") {
          return b.timestamp - a.timestamp;
        }
        return (a.ssid || a.label).localeCompare(b.ssid || b.label);
      });
  }, [points, bandFilter, search, sortBy]);

  return (
    <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-4 sm:p-5 shadow-noc-card flex flex-col">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-radar-teal" />
            Wi-Fi Denetçisi ve Saha Kataloğu
          </h3>
          <p className="text-xs text-radar-subtle mt-0.5">
            RF sinyal şiddetleri, kanal dağılımları ve yerinde gerçekleştirilen ölçümler
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
              <option value="rssi">Sinyal Şiddeti</option>
              <option value="time">En Yeni Kayıt</option>
              <option value="ssid">SSID Adı</option>
            </select>
          </div>

          {/* Band filter buttons */}
          <div className="flex items-center gap-1 bg-radar-bg p-1 rounded-lg border border-radar-border text-xs font-mono">
            {(["TÜMÜ", "2.4 GHz", "5 GHz", "6 GHz"] as BandFilter[]).map((bf) => (
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
              placeholder="SSID / Oda Ara..."
              className="w-full bg-radar-bg border border-radar-border rounded-lg pl-8 pr-2.5 py-1 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-radar-teal"
            />
          </div>
        </div>
      </div>

      {/* List content */}
      {filteredPoints.length === 0 ? (
        <div className="py-10 text-center text-xs font-mono text-radar-subtle bg-radar-bg/40 border border-dashed border-radar-border rounded-lg">
          Kriterlere uyan kayıtlı Wi-Fi ölçüm noktası bulunamadı.
        </div>
      ) : (
        <div className="overflow-x-auto border border-radar-border/80 rounded-lg max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-radar-bg text-radar-subtle sticky top-0 border-b border-radar-border">
              <tr>
                <th className="px-3.5 py-2.5">SSID &amp; Konum</th>
                <th className="px-3.5 py-2.5">Sinyal (RSSI)</th>
                <th className="px-3.5 py-2.5">Bant / Kanal</th>
                <th className="px-3.5 py-2.5">Gecikme</th>
                <th className="px-3.5 py-2.5">Kayıt Türü</th>
                <th className="px-3.5 py-2.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-radar-border/50">
              {filteredPoints.map((p) => {
                const rating = getSignalRating(p.rssi);

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPoint(p)}
                    className="hover:bg-radar-bg/70 cursor-pointer transition-colors"
                  >
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-slate-100">{p.ssid || "Belirtilmemiş"}</div>
                      <div className="text-[11px] text-radar-subtle">{p.label}</div>
                    </td>

                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: rating.color }}
                        />
                        <span className="font-bold text-slate-100">
                          {p.rssi !== undefined ? `${p.rssi} dBm` : "—"}
                        </span>
                        <span className="text-[10px]" style={{ color: rating.color }}>
                          ({rating.label})
                        </span>
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5 text-slate-300">
                      <div>{p.band || "—"}</div>
                      <div className="text-[10px] text-radar-subtle">
                        {p.channel ? `Kanal ${p.channel}` : "—"}
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5">
                      {p.httpLatencyMs !== undefined ? (
                        <span className="text-radar-teal font-medium">
                          {p.httpLatencyMs} ms
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="px-3.5 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-radar-bg border border-radar-border text-[10px] uppercase text-radar-subtle">
                        {p.source === "manual" ? "Manuel" : "İçe Aktarılan"}
                      </span>
                    </td>

                    <td className="px-3.5 py-2.5 text-right">
                      <ChevronRight className="w-4 h-4 text-radar-subtle inline-block" />
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
