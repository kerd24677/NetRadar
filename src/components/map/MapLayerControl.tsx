"use client";

import React, { useState } from "react";
import { Layers, Radio, Activity, Navigation, Compass, TowerControl } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface MapLayerState {
  surveyPoints: boolean;
  signalDensity: boolean;
  latencyView: boolean;
  cellularTowers: boolean;
  walkPath: boolean;
  coordGrid: boolean;
}

interface MapLayerControlProps {
  layers: MapLayerState;
  onChange: (newLayers: MapLayerState) => void;
  className?: string;
}

export function MapLayerControl({ layers, onChange, className }: MapLayerControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (key: keyof MapLayerState) => {
    onChange({
      ...layers,
      [key]: !layers[key],
    });
  };

  const activeCount = Object.values(layers).filter(Boolean).length;

  return (
    <div className={cn("relative z-[500]", className)}>
      {/* Floating Toggle Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-radar-surface/95 border border-radar-border shadow-noc-card text-xs font-mono text-slate-200 hover:text-white hover:border-radar-teal/50 transition-all backdrop-blur-md"
      >
        <Layers className="w-3.5 h-3.5 text-radar-teal" />
        <span>Katmanlar</span>
        <span className="w-4 h-4 rounded-full bg-radar-elevated text-radar-teal text-[10px] font-bold flex items-center justify-center border border-radar-border">
          {activeCount}
        </span>
      </button>

      {/* Dropdown / Modal Switchboard */}
      {isOpen && (
        <div className="absolute top-10 right-0 w-64 bg-radar-surface/95 border border-radar-border rounded-xl p-3 shadow-noc-card backdrop-blur-md space-y-2 text-xs font-mono animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 border-b border-radar-border">
            <span className="text-[11px] font-bold text-radar-teal uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Katman Kontrol Masası
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-radar-subtle hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5">
            {/* Survey Points */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-radar-elevated/60 cursor-pointer select-none transition-colors">
              <div className="flex items-center gap-2 text-slate-200">
                <Radio className="w-3.5 h-3.5 text-radar-cyan" />
                <span>Saha Ölçüm Noktaları</span>
              </div>
              <input
                type="checkbox"
                checked={layers.surveyPoints}
                onChange={() => toggle("surveyPoints")}
                className="w-4 h-4 rounded border-radar-border bg-radar-bg text-radar-teal focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#00F0FF]"
              />
            </label>

            {/* Signal Density (Heatmap) */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-radar-elevated/60 cursor-pointer select-none transition-colors">
              <div className="flex items-center gap-2 text-slate-200">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 inline-block" />
                <span>Sinyal Yoğunluğu (Isı Haritası)</span>
              </div>
              <input
                type="checkbox"
                checked={layers.signalDensity}
                onChange={() => toggle("signalDensity")}
                className="w-4 h-4 rounded border-radar-border bg-radar-bg text-radar-teal focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#00F0FF]"
              />
            </label>

            {/* Latency View */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-radar-elevated/60 cursor-pointer select-none transition-colors">
              <div className="flex items-center gap-2 text-slate-200">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Gecikme Görünümü (ms)</span>
              </div>
              <input
                type="checkbox"
                checked={layers.latencyView}
                onChange={() => toggle("latencyView")}
                className="w-4 h-4 rounded border-radar-border bg-radar-bg text-radar-teal focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#F59E0B]"
              />
            </label>

            {/* Cellular Towers */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-radar-elevated/60 cursor-pointer select-none transition-colors">
              <div className="flex items-center gap-2 text-slate-200">
                <TowerControl className="w-3.5 h-3.5 text-radar-purple" />
                <span>Baz İstasyonu Kuleleri</span>
              </div>
              <input
                type="checkbox"
                checked={layers.cellularTowers}
                onChange={() => toggle("cellularTowers")}
                className="w-4 h-4 rounded border-radar-border bg-radar-bg text-radar-teal focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#A855F7]"
              />
            </label>

            {/* Walk Path */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-radar-elevated/60 cursor-pointer select-none transition-colors">
              <div className="flex items-center gap-2 text-slate-200">
                <Navigation className="w-3.5 h-3.5 text-radar-teal" />
                <span>Ölçüm Güzergâhı</span>
              </div>
              <input
                type="checkbox"
                checked={layers.walkPath}
                onChange={() => toggle("walkPath")}
                className="w-4 h-4 rounded border-radar-border bg-radar-bg text-radar-teal focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#4DE0C1]"
              />
            </label>

            {/* Coordinate Grid */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-radar-elevated/60 cursor-pointer select-none transition-colors">
              <div className="flex items-center gap-2 text-slate-200">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>Koordinat Izgarası</span>
              </div>
              <input
                type="checkbox"
                checked={layers.coordGrid}
                onChange={() => toggle("coordGrid")}
                className="w-4 h-4 rounded border-radar-border bg-radar-bg text-radar-teal focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#38BDF8]"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
