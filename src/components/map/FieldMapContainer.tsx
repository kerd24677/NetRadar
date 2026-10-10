"use client";

import React, { useEffect, useRef } from "react";
import { WifiSurveyPoint, CellularTower } from "@/types/fieldMap";
import { getSignalRating } from "./signalUtils";
import { MapLayerControl, MapLayerState } from "./MapLayerControl";
import type * as LeafletType from "leaflet";

interface FieldMapContainerProps {
  points: WifiSurveyPoint[];
  selectedPoint: WifiSurveyPoint | null;
  onSelectPoint: (point: WifiSurveyPoint) => void;
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  showTowers: boolean;
  towers: CellularTower[];
  onMapClick?: (lat: number, lng: number) => void;
  layers?: MapLayerState;
  onLayersChange?: (layers: MapLayerState) => void;
}

const DEFAULT_LAYERS: MapLayerState = {
  surveyPoints: true,
  signalDensity: true,
  latencyView: false,
  cellularTowers: true,
  walkPath: true,
  coordGrid: true,
};

export function FieldMapContainer({
  points,
  selectedPoint,
  onSelectPoint,
  userLocation,
  showTowers,
  towers,
  onMapClick,
  layers = DEFAULT_LAYERS,
  onLayersChange,
}: FieldMapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletType.Map | null>(null);
  const pointsLayerRef = useRef<LeafletType.LayerGroup | null>(null);
  const densityLayerRef = useRef<LeafletType.LayerGroup | null>(null);
  const walkPathRef = useRef<LeafletType.Polyline | null>(null);
  const userLocLayerRef = useRef<LeafletType.LayerGroup | null>(null);
  const towerLayerRef = useRef<LeafletType.LayerGroup | null>(null);
  const coordGridLayerRef = useRef<LeafletType.LayerGroup | null>(null);

  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current || mapRef.current) return;

      const initLat = userLocation?.lat || points[0]?.lat || 41.0082;
      const initLng = userLocation?.lng || points[0]?.lng || 28.9784;

      const map = L.map(containerRef.current, {
        center: [initLat, initLng],
        zoom: points.length > 0 ? 16 : 14,
        zoomControl: true,
      });

      // OSM dark-filtered tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | NetRadar NOC',
        maxZoom: 19,
      }).addTo(map);

      // Layer groups
      const densityLayer = L.layerGroup().addTo(map);
      const pointsLayer = L.layerGroup().addTo(map);
      const userLocLayer = L.layerGroup().addTo(map);
      const towerLayer = L.layerGroup().addTo(map);
      const coordGridLayer = L.layerGroup().addTo(map);
      const walkPath = L.polyline([], {
        color: "#00F0FF",
        weight: 3,
        opacity: 0.85,
        dashArray: "6, 8",
      }).addTo(map);

      map.on("click", (e) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      mapRef.current = map;
      densityLayerRef.current = densityLayer;
      pointsLayerRef.current = pointsLayer;
      userLocLayerRef.current = userLocLayer;
      towerLayerRef.current = towerLayer;
      coordGridLayerRef.current = coordGridLayer;
      walkPathRef.current = walkPath;
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Survey Points & Signal Density & Walk Path
  useEffect(() => {
    if (!mapRef.current || !pointsLayerRef.current || !walkPathRef.current || !densityLayerRef.current) return;

    import("leaflet").then((L) => {
      const pointsLayer = pointsLayerRef.current;
      const densityLayer = densityLayerRef.current;
      const walkPath = walkPathRef.current;
      if (!pointsLayer || !walkPath || !densityLayer) return;

      pointsLayer.clearLayers();
      densityLayer.clearLayers();

      const sortedPoints = [...points].sort((a, b) => a.timestamp - b.timestamp);
      const latLngs: [number, number][] = [];

      sortedPoints.forEach((p, idx) => {
        latLngs.push([p.lat, p.lng]);
        const rating = getSignalRating(p.rssi);
        const isSelected = selectedPoint?.id === p.id;

        // 1. SIGNAL DENSITY HEATMAP LAYER
        if (layers.signalDensity && p.rssi !== undefined) {
          // Calculate radius based on signal strength (-40 dBm -> 40m, -85 dBm -> 15m)
          const radiusMeters = Math.max(15, Math.min(60, (p.rssi + 100) * 0.8));
          const densityCircle = L.circle([p.lat, p.lng], {
            radius: radiusMeters,
            fillColor: rating.color,
            fillOpacity: 0.22,
            color: rating.color,
            weight: 1,
            opacity: 0.45,
          });
          densityLayer.addLayer(densityCircle);

          // Inner intense core circle
          const coreCircle = L.circle([p.lat, p.lng], {
            radius: radiusMeters * 0.35,
            fillColor: rating.color,
            fillOpacity: 0.4,
            stroke: false,
          });
          densityLayer.addLayer(coreCircle);
        }

        // 2. SURVEY POINTS MARKER LAYER
        if (layers.surveyPoints) {
          const displayLabel = layers.latencyView
            ? p.httpLatencyMs !== undefined
              ? `${Math.round(p.httpLatencyMs)}ms`
              : "N/A"
            : `${idx + 1}`;

          const icon = L.divIcon({
            className: "survey-marker-node",
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
                ${
                  isSelected
                    ? `<div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; border: 2px solid #FFFFFF; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.85;"></div>`
                    : ""
                }
                <div style="width: 26px; height: 26px; border-radius: 9999px; background-color: #050811; border: 2px solid ${
                  rating.color
                }; box-shadow: 0 0 12px ${
              rating.color
            }aa; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 9px; font-weight: 700; color: #FFFFFF; font-family: monospace;">${displayLabel}</span>
                </div>
              </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          });

          const marker = L.marker([p.lat, p.lng], { icon });

          marker.bindPopup(`
            <div style="font-family: monospace; font-size: 11px; padding: 4px; color: #F1F5F9; background: #050811; border: 1px solid #1E2D44; border-radius: 6px;">
              <div style="font-weight: 700; color: #00F0FF; margin-bottom: 3px;">#${idx + 1} ${p.label}</div>
              <div>SSID: <strong>${p.ssid || "Belirtilmemiş"}</strong></div>
              <div>Sinyal (RSSI): <span style="color: ${rating.color}; font-weight: 700;">${
                p.rssi !== undefined ? `${p.rssi} dBm` : "Belirtilmemiş"
              }</span> (${rating.label})</div>
              ${p.httpLatencyMs ? `<div>Gecikme (RTT): <strong style="color: #4DE0C1;">${p.httpLatencyMs} ms</strong></div>` : ""}
              ${p.band ? `<div>Bant: <strong>${p.band}</strong> (Kanal: ${p.channel || "—"})</div>` : ""}
              <div style="color: #64748B; font-size: 9px; margin-top: 4px;">Kayıt: ${new Date(
                p.timestamp
              ).toLocaleTimeString()}</div>
              <div style="color: #94A3B8; font-size: 9px; margin-top: 2px; font-style: italic;">
                Kaynak: ${p.source === "manual" ? "Manuel Kayıt" : "İçe Aktarılan"}
              </div>
            </div>
          `);

          marker.on("click", () => {
            onSelectPoint(p);
          });

          pointsLayer.addLayer(marker);
        }
      });

      // Walk Path toggle
      if (layers.walkPath) {
        walkPath.setLatLngs(latLngs);
      } else {
        walkPath.setLatLngs([]);
      }
    });
  }, [points, selectedPoint, onSelectPoint, layers]);

  // Update Live User Geolocation Marker
  useEffect(() => {
    if (!mapRef.current || !userLocLayerRef.current) return;

    import("leaflet").then((L) => {
      const userLocLayer = userLocLayerRef.current;
      if (!userLocLayer) return;

      userLocLayer.clearLayers();

      if (userLocation) {
        const userIcon = L.divIcon({
          className: "user-loc-node",
          html: `
            <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; background: rgba(0, 240, 255, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 14px; height: 14px; border-radius: 9999px; background: #00F0FF; border: 2.5px solid #FFFFFF; box-shadow: 0 0 10px rgba(0, 240, 255, 0.9);"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        });

        userMarker.bindTooltip("Mevcut Ölçüm Konumu (GPS)", {
          permanent: false,
          direction: "top",
        });

        userLocLayer.addLayer(userMarker);

        if (userLocation.accuracy && userLocation.accuracy > 0) {
          const accuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
            radius: userLocation.accuracy,
            color: "#00F0FF",
            weight: 1,
            fillColor: "#00F0FF",
            fillOpacity: 0.1,
          });
          userLocLayer.addLayer(accuracyCircle);
        }
      }
    });
  }, [userLocation]);

  // Update Public Cellular Towers Layer
  useEffect(() => {
    if (!mapRef.current || !towerLayerRef.current) return;

    import("leaflet").then((L) => {
      const towerLayer = towerLayerRef.current;
      if (!towerLayer) return;

      towerLayer.clearLayers();

      const shouldShowTowers = (showTowers || layers.cellularTowers) && towers.length > 0;

      if (shouldShowTowers) {
        towers.forEach((tower) => {
          const towerIcon = L.divIcon({
            className: "tower-node",
            html: `
              <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #0B1220; border: 1.5px solid #A855F7; box-shadow: 0 0 10px rgba(168, 85, 247, 0.7); display: flex; align-items: center; justify-content: center;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
                  <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
                  <circle cx="12" cy="12" r="2"/>
                  <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
                  <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>
                </svg>
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });

          const marker = L.marker([tower.lat, tower.lng], { icon: towerIcon });
          marker.bindPopup(`
            <div style="font-family: monospace; font-size: 11px; padding: 4px; color: #F1F5F9; background: #050811; border: 1px solid #1E2D44; border-radius: 6px;">
              <div style="font-weight: 700; color: #A855F7; margin-bottom: 2px;">Kamuya Açık Baz İstasyonu</div>
              <div>Radyo: <strong>${tower.radio || "LTE"}</strong></div>
              <div>Operatör: <strong>${tower.operator || "Kamu Altyapısı"}</strong></div>
              <div>Hücre ID: <strong>${tower.cellId || tower.id}</strong></div>
              <div style="color: #64748B; font-size: 9px; margin-top: 3px;">Veri Tabanı: ${tower.source}</div>
              <div style="color: #94A3B8; font-size: 9px; margin-top: 2px; font-style: italic;">
                Not: Haritalanmış kamu kulesidir. Cihazınızın bağlı olduğu kuleyi garanti etmez.
              </div>
            </div>
          `);
          towerLayer.addLayer(marker);
        });
      }
    });
  }, [showTowers, towers, layers.cellularTowers]);

  // Recenter map
  const handleRecenter = () => {
    if (!mapRef.current) return;
    if (userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 17, { animate: true });
    } else if (points.length > 0) {
      mapRef.current.setView([points[points.length - 1].lat, points[points.length - 1].lng], 17, {
        animate: true,
      });
    }
  };

  return (
    <div className="relative w-full h-[430px] sm:h-[500px] lg:h-[560px] rounded-xl overflow-hidden border border-radar-border shadow-2xl bg-radar-bg">
      {/* Map Leaflet Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Top Floating Controls */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
        {onLayersChange && (
          <MapLayerControl layers={layers} onChange={onLayersChange} />
        )}

        <button
          type="button"
          onClick={handleRecenter}
          className="bg-radar-surface/95 hover:bg-radar-elevated border border-radar-border text-slate-200 hover:text-radar-teal p-2 rounded-lg shadow-noc-card backdrop-blur-md text-xs font-mono flex items-center gap-1.5 transition-colors"
          title="Konuma Odaklan"
        >
          <span className="w-2 h-2 rounded-full bg-radar-cyan animate-pulse" />
          <span>Odaklan</span>
        </button>
      </div>

      {/* Turkish Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-radar-surface/95 backdrop-blur-md border border-radar-border/90 rounded-lg p-2.5 shadow-xl text-[10px] font-mono max-w-[280px] sm:max-w-none">
        <div className="text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
          <span>Sinyal Gücü Skalası (RSSI dBm)</span>
          <span className="text-radar-cyan font-bold">{points.length} Saha Noktası</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-radar-subtle">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_#10B981]" />
            <span className="text-emerald-400">&gt; -50 Mükemmel</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_6px_#00F0FF]" />
            <span className="text-cyan-300">-50 ila -65 İyi</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_#F59E0B]" />
            <span className="text-amber-300">-65 ila -75 Orta</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 shadow-[0_0_6px_#FF2E93]" />
            <span className="text-rose-400">&le; -76 Zayıf/Kritik</span>
          </div>
        </div>
      </div>
    </div>
  );
}
