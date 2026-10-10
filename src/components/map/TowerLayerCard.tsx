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
    <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-4 sm:p-5 shadow-noc-card space-y-3.5">
      {/* Header & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-radar-purple" />
            Kamuya Açık Hücresel Altyapı Katmanı
          </h3>
          <p className="text-xs text-radar-subtle mt-0.5">
            Kamuya açık baz istasyonu kulelerine coğrafi yakınlık analizi (OpenCelliD veri seti)
          </p>
        </div>

        <Button
          type="button"
          onClick={onToggleTowers}
          variant="outline"
          className={`text-xs px-3 py-1.5 flex items-center gap-1.5 font-mono ${
            showTowers
              ? "border-purple-400/50 bg-purple-400/10 text-purple-300"
              : "border-radar-border text-slate-400 hover:text-slate-200"
          }`}
        >
          {showTowers ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              Kule Katmanı Aktif
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              Kuleleri Haritada Göster
            </>
          )}
        </Button>
      </div>

      {/* Honest Boundary Notice */}
      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-200/90 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-purple-300">NOC Dürüstlük Bildirimi: </span>
          Web tarayıcıları mobil modem donanımına, bağlı olunan hücre kimliğine (Cell ID) veya RSRP sinyal gücüne erişemez. Aşağıdaki baz istasyonları düz hat Haversine hesaplamasıyla <strong>en yakın kamu referans kulelerini</strong> gösterir; cihazınızın doğrudan bu kuleye bağlı olduğunu garanti etmez.
        </div>
      </div>

      {/* Nearest Tower Distance Calculation */}
      {nearestTowers.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-radar-subtle uppercase">
            <span>En Yakın Referans Baz İstasyonları:</span>
            <span className="text-[10px] text-purple-400">Örnek Referans Noktaları (İstanbul)</span>
          </div>

          {nearestTowers[0].distanceKm > 100 && (
            <div className="p-2.5 rounded bg-radar-bg border border-radar-border text-[11px] text-slate-400 font-mono">
              <span className="text-amber-300 font-semibold">Bölgesel Bildirim: </span>
              Mevcut GPS konumunuz referans istasyonlardan ~{nearestTowers[0].distanceKm} km uzaklıktadır. Çevrimdışı demo veri seti İstanbul OpenCelliD düğümlerini içerir.
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
                    <span className="font-bold text-purple-400 flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      {tower.radio || "LTE"} Kule #{idx + 1}
                    </span>
                    <span className="text-[10px] text-radar-subtle">{tower.source}</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Operatör: <span className="font-semibold">{tower.operator || "Kamu Altyapısı"}</span>
                  </div>
                  <div className="text-radar-subtle text-[10px]">
                    Hücre ID: {tower.cellId || tower.id}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-radar-border flex items-center justify-between">
                  <span className="text-[10px] text-radar-subtle">Kuş Uçuşu:</span>
                  <span className="font-bold text-radar-cyan">
                    {distanceKm < 1 ? `${distanceMeters} m` : `${distanceKm} km`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-radar-bg rounded-lg border border-radar-border text-xs font-mono text-radar-subtle text-center">
          En yakın baz istasyonu mesafesini hesaplamak için lütfen GPS takibini etkinleştirin veya haritadan bir nokta seçin.
        </div>
      )}
    </div>
  );
}
