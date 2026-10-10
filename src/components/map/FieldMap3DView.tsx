"use client";

import React, { useState, useMemo, useRef } from "react";
import { WifiSurveyPoint, CellularTower } from "@/types/fieldMap";
import { getSignalRating } from "./signalUtils";
import { calculateDistanceMeters } from "@/lib/diagnostics/cellularTowers";
import {
  RotateCcw,
  Compass,
  TowerControl,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FieldMap3DViewProps {
  points: WifiSurveyPoint[];
  towers: CellularTower[];
  selectedPoint: WifiSurveyPoint | null;
  onSelectPoint: (point: WifiSurveyPoint) => void;
  showTowers: boolean;
}

export function FieldMap3DView({
  points,
  towers,
  selectedPoint,
  onSelectPoint,
  showTowers,
}: FieldMap3DViewProps) {
  // 3D Perspective controls
  const [rotateZ, setRotateZ] = useState<number>(-25);
  const [rotateX, setRotateX] = useState<number>(55);
  const [elevationScale, setElevationScale] = useState<number>(1);
  const [colorMode, setColorMode] = useState<"rssi" | "latency">("rssi");

  // Drag interaction for 3D rotation
  const [isDragging, setIsDragging] = useState(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Compute normalized bounding box (0 to 600px stage)
  const normalizedEntities = useMemo(() => {
    const allCoords = [
      ...points.map((p) => ({ lat: p.lat, lng: p.lng })),
      ...(showTowers ? towers.map((t) => ({ lat: t.lat, lng: t.lng })) : []),
    ];

    if (allCoords.length === 0) {
      return { normPoints: [], normTowers: [], centerLat: 41.0, centerLng: 28.9 };
    }

    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;

    allCoords.forEach((c) => {
      if (c.lat < minLat) minLat = c.lat;
      if (c.lat > maxLat) maxLat = c.lat;
      if (c.lng < minLng) minLng = c.lng;
      if (c.lng > maxLng) maxLng = c.lng;
    });

    const latSpan = Math.max(0.001, maxLat - minLat);
    const lngSpan = Math.max(0.001, maxLng - minLng);

    // Padding bounds into 100 to 500 px space
    const normPoints = points.map((p) => {
      const x = 100 + ((p.lng - minLng) / lngSpan) * 400;
      const y = 100 + (1 - (p.lat - minLat) / latSpan) * 400;

      // Calculate elevation height (pixels) based on RSSI or latency
      let height = 40;
      if (colorMode === "rssi") {
        const rssi = p.rssi !== undefined ? p.rssi : -80;
        // -30 dBm -> 110px, -90 dBm -> 20px
        height = Math.max(15, Math.min(120, (rssi + 100) * 1.6));
      } else {
        const lat = p.httpLatencyMs || 80;
        // Lower latency -> taller beacon
        height = Math.max(15, Math.min(120, (300 - lat) * 0.4));
      }

      return {
        point: p,
        x,
        y,
        elevation: height * elevationScale,
      };
    });

    const normTowers = (showTowers ? towers : []).map((t) => {
      const x = 100 + ((t.lng - minLng) / lngSpan) * 400;
      const y = 100 + (1 - (t.lat - minLat) / latSpan) * 400;
      return {
        tower: t,
        x,
        y,
        elevation: 140 * elevationScale, // Towers stand significantly higher
      };
    });

    return {
      normPoints,
      normTowers,
      centerLat: (minLat + maxLat) / 2,
      centerLng: (minLng + maxLng) / 2,
    };
  }, [points, towers, showTowers, elevationScale, colorMode]);

  // Compute nearest distance vector lines between points and towers
  const distanceVectors = useMemo(() => {
    if (!showTowers || towers.length === 0 || points.length === 0) return [];

    return normalizedEntities.normPoints.slice(0, 15).map((np) => {
      let nearestTower = normalizedEntities.normTowers[0];
      let minMeters = Infinity;

      normalizedEntities.normTowers.forEach((nt) => {
        const d = calculateDistanceMeters(
          np.point.lat,
          np.point.lng,
          nt.tower.lat,
          nt.tower.lng
        );
        if (d < minMeters) {
          minMeters = d;
          nearestTower = nt;
        }
      });

      return {
        from: np,
        to: nearestTower,
        distanceMeters: Math.round(minMeters),
      };
    });
  }, [normalizedEntities, showTowers, towers.length, points.length]);

  return (
    <div className="space-y-4">
      {/* 3D Viewport Controls HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-radar-surface/90 border border-radar-border rounded-xl p-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-radar-teal font-bold">
            <Compass className="w-4 h-4 animate-spin-slow" />
            <span>3D İZOMETRİK SAHA VE KULE GÖRÜNÜMÜ</span>
          </div>
          <span className="text-radar-subtle hidden sm:inline">
            Açı: {rotateZ}° / Eğim: {rotateX}° / Ölçek: {elevationScale}x
          </span>
        </div>

        {/* Control Sliders & Reset */}
        <div className="flex items-center gap-2">
          {/* Color Mode Switcher */}
          <div className="flex items-center bg-radar-bg rounded-lg border border-radar-border p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setColorMode("rssi")}
              className={`px-2 py-1 rounded transition-colors ${
                colorMode === "rssi"
                  ? "bg-radar-teal/20 text-radar-teal font-bold"
                  : "text-slate-400"
              }`}
            >
              Sinyal (RSSI)
            </button>
            <button
              type="button"
              onClick={() => setColorMode("latency")}
              className={`px-2 py-1 rounded transition-colors ${
                colorMode === "latency"
                  ? "bg-radar-teal/20 text-radar-teal font-bold"
                  : "text-slate-400"
              }`}
            >
              Gecikme (ms)
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRotateZ(-25);
              setRotateX(55);
              setElevationScale(1);
            }}
            className="text-xs h-7 px-2"
            title="Açıyı Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 3D Stage Container */}
      <div
        className="relative w-full h-[450px] sm:h-[540px] bg-radar-bg rounded-xl border border-radar-border overflow-hidden select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
        onMouseDown={(e) => {
          setIsDragging(true);
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          const dx = e.clientX - lastMouseRef.current.x;
          const dy = e.clientY - lastMouseRef.current.y;
          setRotateZ((rz) => Math.min(60, Math.max(-60, rz + dx * 0.4)));
          setRotateX((rx) => Math.min(80, Math.max(20, rx - dy * 0.4)));
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            setIsDragging(true);
            lastMouseRef.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
            };
          }
        }}
        onTouchMove={(e) => {
          if (!isDragging || e.touches.length !== 1) return;
          const dx = e.touches[0].clientX - lastMouseRef.current.x;
          const dy = e.touches[0].clientY - lastMouseRef.current.y;
          setRotateZ((rz) => Math.min(60, Math.max(-60, rz + dx * 0.4)));
          setRotateX((rx) => Math.min(80, Math.max(20, rx - dy * 0.4)));
          lastMouseRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }}
        onTouchEnd={() => setIsDragging(false)}
      >
        {/* Background Cyber Grid */}
        <div className="absolute inset-0 noc-grid-bg opacity-80 pointer-events-none" />

        {/* Watermark coordinates */}
        <div className="absolute top-3 left-3 text-[10px] font-mono text-radar-subtle/80 pointer-events-none z-10">
          PROJECTION: ISOMETRIC_Z // ROTATE_Z: {Math.round(rotateZ)}° // TILT_X:{" "}
          {Math.round(rotateX)}°
        </div>

        {/* 3D Transformed Plane */}
        <div
          className="relative w-[600px] h-[600px] transition-transform duration-75"
          style={{
            transform: `perspective(1200px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Base Plate Floor */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-radar-border/80 shadow-[0_0_50px_rgba(0,240,255,0.06)] bg-radar-surface/40"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0, 240, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.08) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          >
            {/* Center Axis Compass */}
            <div className="absolute top-2 left-2 text-[10px] font-mono text-radar-cyan/60">
              KUZEY ↑ (N)
            </div>
          </div>

          {/* Render Vector Lines Between Towers and Survey Points */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 600 600"
            style={{ overflow: "visible" }}
          >
            {distanceVectors.map((vec, idx) => (
              <g key={`vec_${idx}`}>
                <line
                  x1={vec.from.x}
                  y1={vec.from.y}
                  x2={vec.to.x}
                  y2={vec.to.y}
                  stroke="#A855F7"
                  strokeWidth="1.2"
                  strokeDasharray="4, 4"
                  opacity="0.4"
                />
              </g>
            ))}
          </svg>

          {/* Render Cellular Towers (3D Tall Beacons) */}
          {normalizedEntities.normTowers.map((nt, idx) => (
            <div
              key={`tower_3d_${idx}`}
              className="absolute pointer-events-none"
              style={{
                left: `${nt.x}px`,
                top: `${nt.y}px`,
                transform: `translate(-50%, -50%) translateZ(${nt.elevation}px)`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Vertical Laser Shaft */}
              <div
                className="absolute left-1/2 bottom-0 w-1 bg-gradient-to-t from-radar-purple/20 to-radar-purple"
                style={{
                  height: `${nt.elevation}px`,
                  transform: "translateX(-50%) rotateX(-90deg)",
                  transformOrigin: "bottom center",
                }}
              />

              {/* Glowing Tower Head Beacon */}
              <div className="relative flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-lg bg-radar-bg border-2 border-radar-purple flex items-center justify-center text-radar-purple shadow-[0_0_15px_#A855F7]">
                  <TowerControl className="w-4 h-4" />
                </div>
                <div className="mt-1 px-1.5 py-0.5 rounded bg-radar-bg/90 border border-radar-purple text-[9px] font-mono text-radar-purple whitespace-nowrap shadow-md">
                  {nt.tower.operator || "Baz İstasyonu"}
                </div>
              </div>
            </div>
          ))}

          {/* Render Survey Points (Elevated 3D Column Beacons) */}
          {normalizedEntities.normPoints.map((np, idx) => {
            const isSelected = selectedPoint?.id === np.point.id;
            const rating = getSignalRating(np.point.rssi);

            return (
              <div
                key={`point_3d_${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPoint(np.point);
                }}
                className="absolute cursor-pointer group"
                style={{
                  left: `${np.x}px`,
                  top: `${np.y}px`,
                  transform: `translate(-50%, -50%) translateZ(${np.elevation}px)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Vertical Elevation Pillar to Baseplate */}
                <div
                  className="absolute left-1/2 bottom-0 w-0.5"
                  style={{
                    height: `${np.elevation}px`,
                    backgroundColor: rating.color,
                    opacity: 0.6,
                    transform: "translateX(-50%) rotateX(-90deg)",
                    transformOrigin: "bottom center",
                    boxShadow: `0 0 8px ${rating.color}`,
                  }}
                />

                {/* Ground shadow spot */}
                <div
                  className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    backgroundColor: rating.color,
                    opacity: 0.2,
                    filter: "blur(2px)",
                  }}
                />

                {/* Elevated Beacon Ring */}
                <div className="relative flex flex-col items-center">
                  {isSelected && (
                    <div
                      className="absolute -inset-2 rounded-full animate-ping opacity-75"
                      style={{ border: `2px solid ${rating.color}` }}
                    />
                  )}

                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white transition-transform duration-150 group-hover:scale-125"
                    style={{
                      backgroundColor: "#050811",
                      border: `2px solid ${isSelected ? "#FFFFFF" : rating.color}`,
                      boxShadow: `0 0 12px ${rating.color}`,
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Floating Tag */}
                  <div
                    className="mt-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold whitespace-nowrap opacity-90 transition-opacity"
                    style={{
                      backgroundColor: "#0B1220",
                      color: rating.color,
                      border: `1px solid ${rating.color}66`,
                    }}
                  >
                    {colorMode === "rssi"
                      ? `${np.point.rssi ?? "N/A"} dBm`
                      : `${np.point.httpLatencyMs ?? "N/A"} ms`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Helper Bar */}
        <div className="absolute bottom-2 left-3 right-3 p-2 rounded-lg bg-radar-surface/90 border border-radar-border/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-radar-subtle z-10 pointer-events-none">
          <div className="flex items-center gap-3">
            <span>🖱️ Sürükleyerek açıyı döndürün ve eğin</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">
              Sütun yüksekliği sinyal şiddetiyle (dBm) orantılıdır
            </span>
          </div>
          <span className="text-slate-300 font-semibold">
            {points.length} Saha Noktası {showTowers ? `• ${towers.length} Kule` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
