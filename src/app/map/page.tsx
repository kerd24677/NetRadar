"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { WifiSurveyPoint } from "@/types/fieldMap";
import {
  getAllSurveyPoints,
  saveSurveyPoint,
  saveSurveyPointsBulk,
  deleteSurveyPoint,
  clearAllSurveyPoints,
} from "@/lib/storage/fieldMapStore";
import { SAMPLE_PUBLIC_TOWERS } from "@/lib/diagnostics/cellularTowers";

import { SurveyPointModal } from "@/components/map/SurveyPointModal";
import { PointDetailBottomSheet } from "@/components/map/PointDetailBottomSheet";
import { WifiInspectorList } from "@/components/map/WifiInspectorList";
import { TowerLayerCard } from "@/components/map/TowerLayerCard";
import { FieldSurveyExportImport } from "@/components/map/FieldSurveyExportImport";
import { FieldMap3DView } from "@/components/map/FieldMap3DView";
import { MapLayerState } from "@/components/map/MapLayerControl";

import {
  MapPin,
  Navigation,
  Plus,
  Info,
  List,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// Dynamic import with SSR disabled for Leaflet map component
const DynamicFieldMap = dynamic(
  () => import("@/components/map/FieldMapContainer").then((mod) => mod.FieldMapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[430px] sm:h-[500px] lg:h-[560px] rounded-xl bg-radar-bg border border-radar-border flex flex-col items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full bg-radar-teal animate-ping" />
        <span className="text-xs font-mono text-radar-subtle">
          OpenStreetMap NOC Saha Haritası Yükleniyor...
        </span>
      </div>
    ),
  }
);

export default function FieldMapPage() {
  const [points, setPoints] = useState<WifiSurveyPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<WifiSurveyPoint | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
  } | null>(null);
  const [isTrackingGps, setIsTrackingGps] = useState(false);

  // View mode switcher: "map" | "3d" | "inspector"
  const [activeTab, setActiveTab] = useState<"map" | "3d" | "inspector">("map");

  // Map layer controls
  const [layers, setLayers] = useState<MapLayerState>({
    surveyPoints: true,
    signalDensity: true,
    latencyView: false,
    cellularTowers: true,
    walkPath: true,
    coordGrid: true,
  });

  // Modal controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [clickedMapCoords, setClickedMapCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  // Cellular Tower Layer toggle
  const [showTowers, setShowTowers] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Load survey points from IndexedDB on mount
  const loadPoints = useCallback(async () => {
    try {
      const stored = await getAllSurveyPoints();
      setPoints(stored);
    } catch (err) {
      console.warn("Saha ölçüm noktaları yüklenemedi:", err);
    }
  }, []);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const stopGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTrackingGps(false);
  }, []);

  // Handle continuous GPS tracking
  const toggleGpsTracking = () => {
    if (isTrackingGps) {
      stopGpsTracking();
      return;
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setIsTrackingGps(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn("İlk GPS konumu alınamadı:", err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          if (err.code === 1) {
            alert("Konum izni reddedildi. Lütfen cihaz ayarlarınızdan konum iznini etkinleştirin.");
            stopGpsTracking();
          } else {
            console.warn("GPS izleme uyarısı:", err.message);
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
      );
      watchIdRef.current = id;
    } else {
      alert("Bu tarayıcıda coğrafi konum servisi desteklenmiyor.");
    }
  };

  useEffect(() => {
    return () => {
      stopGpsTracking();
    };
  }, [stopGpsTracking]);

  const handleSavePoint = async (newPoint: WifiSurveyPoint) => {
    await saveSurveyPoint(newPoint);
    await loadPoints();
    setClickedMapCoords(null);
  };

  const handleUpdatePoint = async (updated: WifiSurveyPoint) => {
    await saveSurveyPoint(updated);
    setSelectedPoint(updated);
    await loadPoints();
  };

  const handleDeletePoint = async (id: string) => {
    await deleteSurveyPoint(id);
    await loadPoints();
    setSelectedPoint(null);
  };

  const handleClearAll = async () => {
    await clearAllSurveyPoints();
    setPoints([]);
    setSelectedPoint(null);
  };

  const handleBulkImport = async (imported: WifiSurveyPoint[]) => {
    await saveSurveyPointsBulk(imported);
    await loadPoints();
  };

  const handleMapClick = (lat: number, lng: number) => {
    setClickedMapCoords({ lat, lng });
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title & Primary Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-radar-teal" />
            Wi-Fi Sinyal ve Saha Kapsama Haritası
          </h1>
          <p className="text-xs sm:text-sm text-radar-subtle mt-0.5">
            GPS yürüyüş güzergâhı, sinyal yoğunluk alanı, 3D izometrik perspektif ve baz istasyonu yakınlığı
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* GPS Track Toggle */}
          <Button
            type="button"
            onClick={toggleGpsTracking}
            variant="outline"
            className={`text-xs px-3 py-2 flex items-center gap-1.5 font-mono ${
              isTrackingGps
                ? "border-radar-teal text-radar-teal bg-radar-teal/10 shadow-noc-glow"
                : "border-radar-border text-slate-300 hover:text-slate-100"
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isTrackingGps ? "animate-spin" : ""}`} />
            {isTrackingGps ? "GPS Aktif" : "GPS Takibi Başlat"}
          </Button>

          {/* Add Survey Point */}
          <Button
            type="button"
            onClick={() => {
              setClickedMapCoords(null);
              setIsAddModalOpen(true);
            }}
            className="bg-radar-teal hover:bg-radar-teal/90 text-slate-950 font-semibold text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-noc-glow"
          >
            <Plus className="w-4 h-4" />
            Ölçüm Noktası Ekle
          </Button>
        </div>
      </div>

      {/* Honest Technical Notice */}
      <div className="bg-radar-surface/60 border border-radar-border/80 rounded-xl p-3 sm:p-4 flex items-start gap-3 text-xs font-mono text-radar-subtle">
        <Info className="w-4 h-4 text-radar-teal shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Tarayıcı Güvenlik Sınırı Bildirimi: </span>
          iOS Safari ve modern tarayıcılar işletim sistemi gizlilik politikası gereği doğrudan ham Wi-Fi çipine (çevredeki BSSID/RSSI işaretçileri) erişemez. NetRadar, saha teknisyeninin manuel RF kayıtlarını, canlı GPS etiketlemesini ve harici analiz cihazlarından içe aktarılan verileri kullanır.
        </div>
      </div>

      {/* View Switcher Tabs: 2D Harita vs 3D İzometrik vs Wi-Fi Kataloğu */}
      <div className="flex items-center gap-1 bg-radar-surface/90 p-1 rounded-xl border border-radar-border w-fit text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("map")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === "map"
              ? "bg-radar-teal/20 text-radar-teal font-semibold shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          2D Kapsama Haritası ({points.length} Nokta)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("3d")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === "3d"
              ? "bg-radar-teal/20 text-radar-teal font-semibold shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          3D İzometrik Saha &amp; Kuleler
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("inspector")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === "inspector"
              ? "bg-radar-teal/20 text-radar-teal font-semibold shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <List className="w-3.5 h-3.5" />
          Wi-Fi Katalog Denetçisi
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "map" ? (
        <div className="space-y-4">
          {/* Leaflet Field Map Container with Live Heatmap and Switchboard */}
          <DynamicFieldMap
            points={points}
            selectedPoint={selectedPoint}
            onSelectPoint={setSelectedPoint}
            userLocation={userLocation}
            showTowers={showTowers}
            towers={SAMPLE_PUBLIC_TOWERS}
            onMapClick={handleMapClick}
            layers={layers}
            onLayersChange={setLayers}
          />

          {/* Cellular Tower Proximity Layer */}
          <TowerLayerCard
            showTowers={showTowers}
            onToggleTowers={() => setShowTowers((prev) => !prev)}
            userCoords={userLocation || (points[0] ? { lat: points[0].lat, lng: points[0].lng } : null)}
            towers={SAMPLE_PUBLIC_TOWERS}
          />
        </div>
      ) : activeTab === "3d" ? (
        <div className="space-y-4">
          {/* 3D Isometric View (Module 4) */}
          <FieldMap3DView
            points={points}
            towers={SAMPLE_PUBLIC_TOWERS}
            selectedPoint={selectedPoint}
            onSelectPoint={setSelectedPoint}
            showTowers={showTowers || layers.cellularTowers}
          />

          <TowerLayerCard
            showTowers={showTowers}
            onToggleTowers={() => setShowTowers((prev) => !prev)}
            userCoords={userLocation || (points[0] ? { lat: points[0].lat, lng: points[0].lng } : null)}
            towers={SAMPLE_PUBLIC_TOWERS}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Wi-Fi Inspector View */}
          <WifiInspectorList points={points} onSelectPoint={setSelectedPoint} />
        </div>
      )}

      {/* Data Portability (Export GeoJSON/CSV & Import) */}
      <FieldSurveyExportImport
        points={points}
        onImportPoints={handleBulkImport}
        onClearPoints={handleClearAll}
      />

      {/* Add Survey Point Modal */}
      <SurveyPointModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setClickedMapCoords(null);
        }}
        onSavePoint={handleSavePoint}
        initialCoords={clickedMapCoords}
        userLocation={userLocation}
      />

      {/* Point Detail Modal / Bottom Sheet */}
      <PointDetailBottomSheet
        point={selectedPoint}
        onClose={() => setSelectedPoint(null)}
        onDeletePoint={handleDeletePoint}
        onUpdatePoint={handleUpdatePoint}
      />
    </div>
  );
}
