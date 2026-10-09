"use client";

import React from "react";
import { CellularTower, TowerDistanceResult } from "@/types/fieldMap";
import { findNearestTowers } from "@/lib/diagnostics/cellularTowers";
import { Radio, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TowerLayerCardProps {
  showTowers: boolean;
  onToggleTowers: () => void;
  userCoords?: { lat: number; lng: number } | null;
  towers: CellularTower[];
}

export function TowerLayerCard({
  showTowers,
  onToggleTowers,
  userCoords,
  towers,
}: TowerLayerCardProps) {
  const nearestTowers: TowerDistanceResult[] = React.useMemo(() => {
    if (!userCoords) return [];
    return findNearestTowers(userCoords.lat, userCoords.lng, towers, 3);
  }, [userCoords, towers]);

  return (
    <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-4 sm:p-5 shadow-lg space-y-3.5">
      {/* Header & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            Public Cellular Infrastructure Layer
          </h3>
          <p className="text-xs text-radar-subtle mt-0.5">
            Geographic proximity to public cell towers (OpenCelliD dataset)
          </p>
        </div>

        <Button
          type="button"
          onClick={onToggleTowers}
          variant="outline"
          className={`text-xs px-3 py-1.5 flex items-center gap-1.5 font-mono ${
            showTowers
              ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
              : "border-radar-border text-slate-400 hover:text-slate-200"
          }`}
        >
          {showTowers ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              Tower Layer Active
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              Show Towers on Map
            </>
          )}
        </Button>
      </div>

      {/* Honest Boundary Notice */}
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-200/90 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">NOC Integrity Notice: </span>
          Web browsers cannot read mobile baseband hardware, serving cell IDs, or RSRP signal strength. The towers listed below represent the <strong>nearest mapped public base stations</strong> via straight-line Haversine calculation, not your verified serving cell.
        </div>
      </div>

      {/* Nearest Tower Distance Calculation */}
      {nearestTowers.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-radar-subtle uppercase">
            <span>Nearest Mapped Reference Towers:</span>
            <span className="text-[10px] text-amber-400">Sample Reference Nodes (Istanbul)</span>
          </div>

          {nearestTowers[0].distanceKm > 100 && (
            <div className="p-2.5 rounded bg-radar-bg border border-radar-border text-[11px] text-slate-400 font-mono">
              <span className="text-amber-300 font-semibold">Regional Notice: </span>
              Your current GPS location is ~{nearestTowers[0].distanceKm} km from the included reference base stations. The offline demo dataset includes Istanbul OpenCelliD nodes. Global lookups require configuring a regional OpenCelliD database dump.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {nearestTowers.map(({ tower, distanceKm, distanceMeters }, idx) => (
              <div
                key={tower.id}
                className="bg-radar-bg p-3 rounded-lg border border-radar-border text-xs font-mono flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      {tower.radio || "LTE"} Tower #{idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ID: {tower.cellId || tower.id.substring(0, 6)}
                    </span>
                  </div>
                  <div className="text-slate-300 font-semibold text-sm">
                    ~{distanceKm} km
                    <span className="text-xs text-radar-subtle font-normal ml-1">
                      ({distanceMeters}m)
                    </span>
                  </div>
                  <div className="text-[11px] text-radar-subtle mt-0.5">
                    {tower.operator || "Public Infrastructure"}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 mt-2 pt-1 border-t border-radar-border/60 flex items-center justify-between">
                  <span>MCC: {tower.mcc || 286} MNC: {tower.mnc || "01"}</span>
                  <span>{tower.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-xs font-mono text-radar-subtle bg-radar-bg/40 border border-dashed border-radar-border rounded-lg">
          {userCoords
            ? "No public towers found in the local radius."
            : "Acquire GPS location to calculate straight-line proximity to nearest public cellular towers."}
        </div>
      )}
    </div>
  );
}
