"use client";

import React, { useEffect, useRef } from "react";
import { WifiSurveyPoint, CellularTower } from "@/types/fieldMap";
import { getSignalRating } from "./signalUtils";
import type * as LeafletType from "leaflet";

interface FieldMapContainerProps {
  points: WifiSurveyPoint[];
  selectedPoint: WifiSurveyPoint | null;
  onSelectPoint: (point: WifiSurveyPoint) => void;
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  showTowers: boolean;
  towers: CellularTower[];
  onMapClick?: (lat: number, lng: number) => void;
}

export function FieldMapContainer({
  points,
  selectedPoint,
  onSelectPoint,
  userLocation,
  showTowers,
  towers,
  onMapClick,
}: FieldMapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletType.Map | null>(null);
  const pointsLayerRef = useRef<LeafletType.LayerGroup | null>(null);
  const walkPathRef = useRef<LeafletType.Polyline | null>(null);
  const userLocLayerRef = useRef<LeafletType.LayerGroup | null>(null);
  const towerLayerRef = useRef<LeafletType.LayerGroup | null>(null);

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

      // Default center: user location, or first point, or Istanbul/neutral coordinate
      const initLat = userLocation?.lat || points[0]?.lat || 41.0082;
      const initLng = userLocation?.lng || points[0]?.lng || 28.9784;

      const map = L.map(containerRef.current, {
        center: [initLat, initLng],
        zoom: points.length > 0 ? 16 : 14,
        zoomControl: true,
      });

      // OSM dark-filtered tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Initialize layer groups
      const pointsLayer = L.layerGroup().addTo(map);
      const userLocLayer = L.layerGroup().addTo(map);
      const towerLayer = L.layerGroup().addTo(map);
      const walkPath = L.polyline([], {
        color: "#4DE0C1",
        weight: 3,
        opacity: 0.8,
        dashArray: "6, 8",
      }).addTo(map);

      // Handle map clicks
      map.on("click", (e) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      mapRef.current = map;
      pointsLayerRef.current = pointsLayer;
      userLocLayerRef.current = userLocLayer;
      towerLayerRef.current = towerLayer;
      walkPathRef.current = walkPath;
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Map instance initialization should only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Survey Points & Walk Path
  useEffect(() => {
    if (!mapRef.current || !pointsLayerRef.current || !walkPathRef.current) return;

    import("leaflet").then((L) => {
      const pointsLayer = pointsLayerRef.current;
      const walkPath = walkPathRef.current;
      if (!pointsLayer || !walkPath) return;

      pointsLayer.clearLayers();

      const sortedPoints = [...points].sort((a, b) => a.timestamp - b.timestamp);
      const latLngs: [number, number][] = [];

      sortedPoints.forEach((p, idx) => {
        latLngs.push([p.lat, p.lng]);
        const rating = getSignalRating(p.rssi);
        const isSelected = selectedPoint?.id === p.id;

        // Custom DivIcon for glowing NOC survey marker
        const icon = L.divIcon({
          className: "survey-marker-node",
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
              ${
                isSelected
                  ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; border: 2px solid #FFFFFF; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>`
                  : ""
              }
              <div style="width: 24px; height: 24px; border-radius: 9999px; background-color: #0B1220; border: 2px solid ${
                rating.color
              }; box-shadow: 0 0 10px ${
            rating.color
          }88; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 10px; font-weight: 700; color: #FFFFFF; font-family: monospace;">${
                  idx + 1
                }</span>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([p.lat, p.lng], { icon });

        // Tooltip popup
        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px; color: #F1F5F9; background: #0B1220;">
            <div style="font-weight: 700; color: #4DE0C1; margin-bottom: 2px;">#${idx + 1} ${p.label}</div>
            <div>SSID: <strong>${p.ssid || "Unspecified"}</strong></div>
            <div>Signal: <span style="color: ${rating.color}; font-weight: 700;">${
              p.rssi !== undefined ? `${p.rssi} dBm` : "N/A"
            }</span> (${rating.label})</div>
            ${p.httpLatencyMs ? `<div>Latency: <strong>${p.httpLatencyMs} ms</strong></div>` : ""}
            ${p.band ? `<div>Band: <strong>${p.band}</strong> (Ch: ${p.channel || "—"})</div>` : ""}
            <div style="color: #64748B; font-size: 9px; margin-top: 3px;">${new Date(
              p.timestamp
            ).toLocaleTimeString()}</div>
          </div>
        `);

        marker.on("click", () => {
          onSelectPoint(p);
        });

        pointsLayer.addLayer(marker);
      });

      // Update chronological walk path polyline
      walkPath.setLatLngs(latLngs);
    });
  }, [points, selectedPoint, onSelectPoint]);

  // Update Live User Geolocation Marker & Accuracy Circle
  useEffect(() => {
    if (!mapRef.current || !userLocLayerRef.current) return;

    import("leaflet").then((L) => {
      const userLocLayer = userLocLayerRef.current;
      if (!userLocLayer) return;

      userLocLayer.clearLayers();

      if (userLocation) {
        // User marker icon
        const userIcon = L.divIcon({
          className: "user-loc-node",
          html: `
            <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 22px; height: 22px; border-radius: 9999px; background: rgba(70, 168, 255, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 14px; height: 14px; border-radius: 9999px; background: #46A8FF; border: 2.5px solid #FFFFFF; box-shadow: 0 0 8px rgba(70, 168, 255, 0.9);"></div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        });

        userMarker.bindTooltip("Current Surveyor Position", {
          permanent: false,
          direction: "top",
        });

        userLocLayer.addLayer(userMarker);

        // Accuracy circle
        if (userLocation.accuracy && userLocation.accuracy > 0) {
          const accuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
            radius: userLocation.accuracy,
            color: "#46A8FF",
            weight: 1,
            fillColor: "#46A8FF",
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

      if (showTowers && towers.length > 0) {
        towers.forEach((tower) => {
          const towerIcon = L.divIcon({
            className: "tower-node",
            html: `
              <div style="width: 24px; height: 24px; border-radius: 6px; background-color: #101A2B; border: 1.5px solid #F59E0B; box-shadow: 0 0 6px rgba(245, 158, 11, 0.6); display: flex; align-items: center; justify-content: center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
                  <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
                  <circle cx="12" cy="12" r="2"/>
                  <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
                  <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>
                </svg>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker([tower.lat, tower.lng], { icon: towerIcon });
          marker.bindPopup(`
            <div style="font-family: monospace; font-size: 11px; padding: 2px; color: #F1F5F9; background: #0B1220;">
              <div style="font-weight: 700; color: #F59E0B; margin-bottom: 2px;">Public Cellular Tower</div>
              <div>Radio: <strong>${tower.radio || "LTE"}</strong></div>
              <div>Operator: <strong>${tower.operator || "Public Infrastructure"}</strong></div>
              <div>Cell ID: <strong>${tower.cellId || tower.id}</strong></div>
              <div style="color: #64748B; font-size: 9px; margin-top: 3px;">Source: ${tower.source}</div>
              <div style="color: #94A3B8; font-size: 9px; margin-top: 2px; font-style: italic;">
                Note: Mapped public tower. Not necessarily your serving cell.
              </div>
            </div>
          `);
          towerLayer.addLayer(marker);
        });
      }
    });
  }, [showTowers, towers]);

  // Recenter map on user location or first point
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
    <div className="relative w-full h-[420px] sm:h-[500px] lg:h-[560px] rounded-xl overflow-hidden border border-radar-border shadow-2xl bg-radar-bg">
      {/* Map Leaflet Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Recenter Button Overlay */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleRecenter}
          className="bg-radar-surface/90 hover:bg-radar-surface border border-radar-border text-slate-200 hover:text-radar-teal p-2 rounded-lg shadow-lg backdrop-blur-md text-xs font-mono flex items-center gap-1.5 transition-colors"
          title="Recenter on surveyor"
        >
          <span className="w-2 h-2 rounded-full bg-radar-teal animate-pulse" />
          Recenter
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-radar-surface/90 backdrop-blur-md border border-radar-border/80 rounded-lg p-2.5 shadow-xl text-[10px] font-mono max-w-[260px] sm:max-w-none">
        <div className="text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
          <span>Signal Strength (dBm)</span>
          <span className="text-radar-subtle">{points.length} Points</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-radar-subtle">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-emerald-400">&gt; -50 Excellent</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-emerald-300">-50 to -65 Good</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span className="text-amber-300">-65 to -75 Fair</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
            <span className="text-orange-400">-75 to -85 Poor</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-red-400">&lt; -85 Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
