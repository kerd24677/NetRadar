"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { WifiSurveyPoint } from "@/types/fieldMap";
import { getSignalRating } from "./signalUtils";
import { measureHttpLatency } from "@/lib/diagnostics/httpPing";
import {
  MapPin,
  Wifi,
  Radio,
  Sliders,
  Activity,
  FileText,
  AlertCircle,
  Navigation,
} from "lucide-react";

interface SurveyPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePoint: (point: WifiSurveyPoint) => void;
  initialCoords?: { lat: number; lng: number } | null;
  userLocation?: { lat: number; lng: number; accuracy?: number } | null;
}

export function SurveyPointModal({
  isOpen,
  onClose,
  onSavePoint,
  initialCoords,
  userLocation,
}: SurveyPointModalProps) {
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [label, setLabel] = useState("");
  const [ssid, setSsid] = useState("");
  const [bssid, setBssid] = useState("");
  const [rssi, setRssi] = useState<number>(-65);
  const [band, setBand] = useState<"2.4 GHz" | "5 GHz" | "6 GHz">("5 GHz");
  const [channel, setChannel] = useState<number>(36);
  const [notes, setNotes] = useState("");

  // Live Latency Test state
  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const [measuredLatency, setMeasuredLatency] = useState<number | undefined>(undefined);

  // Sync initial coords
  useEffect(() => {
    if (initialCoords) {
      setLat(Math.round(initialCoords.lat * 1000000) / 1000000);
      setLng(Math.round(initialCoords.lng * 1000000) / 1000000);
      setAccuracy(userLocation?.accuracy);
    } else if (userLocation) {
      setLat(Math.round(userLocation.lat * 1000000) / 1000000);
      setLng(Math.round(userLocation.lng * 1000000) / 1000000);
      setAccuracy(userLocation.accuracy);
    }
  }, [initialCoords, userLocation, isOpen]);

  // Request fresh GPS location
  const handleFetchCurrentGps = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Math.round(pos.coords.latitude * 1000000) / 1000000);
          setLng(Math.round(pos.coords.longitude * 1000000) / 1000000);
          setAccuracy(pos.coords.accuracy);
        },
        (err) => {
          alert(`Could not acquire GPS: ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Run quick on-site HTTP latency probe
  const handleMeasureSpotLatency = async () => {
    setIsTestingLatency(true);
    try {
      const res = await measureHttpLatency("https://1.1.1.1/cdn-cgi/trace");
      if (res.durationMs > 0) {
        setMeasuredLatency(res.durationMs);
      }
    } catch (err) {
      console.warn("Spot latency test failed:", err);
    } finally {
      setIsTestingLatency(false);
    }
  };

  const handleSave = () => {
    if (!label.trim()) {
      alert("Please provide a location note or label (e.g. 'Conference Room A')");
      return;
    }

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) {
      alert("Please acquire a valid GPS fix or tap on the map to set location coordinates.");
      return;
    }

    const point: WifiSurveyPoint = {
      id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      lat,
      lng,
      accuracyMeters: accuracy,
      label: label.trim(),
      source: "manual",
      ssid: ssid.trim() || undefined,
      bssid: bssid.trim() || undefined,
      rssi,
      band,
      channel: channel || undefined,
      httpLatencyMs: measuredLatency,
      notes: notes.trim() || undefined,
    };

    onSavePoint(point);
    // Reset form
    setLabel("");
    setSsid("");
    setBssid("");
    setNotes("");
    setMeasuredLatency(undefined);
    onClose();
  };

  const rating = getSignalRating(rssi);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Wi-Fi Field Survey Point">
      <div className="space-y-4 text-xs font-mono">
        {/* Capability disclaimer */}
        <div className="p-2.5 rounded-lg bg-radar-bg border border-radar-border flex items-start gap-2 text-radar-subtle text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            iOS Safari restricts direct background RF scanning. Enter observed Wi-Fi readings or survey data, and measure live latency at this GPS fix.
          </div>
        </div>

        {/* GPS Coordinates & Accuracy */}
        <div className="bg-radar-bg/70 p-3 rounded-lg border border-radar-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-radar-teal" />
              GPS COORDINATES
            </span>
            <button
              type="button"
              onClick={handleFetchCurrentGps}
              className="text-radar-teal hover:underline text-[11px] flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" />
              Refresh Current GPS
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-radar-subtle block mb-1">LATITUDE</label>
              <input
                type="number"
                step="any"
                value={lat || ""}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="w-full bg-radar-surface border border-radar-border rounded px-2.5 py-1.5 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-radar-subtle block mb-1">LONGITUDE</label>
              <input
                type="number"
                step="any"
                value={lng || ""}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                className="w-full bg-radar-surface border border-radar-border rounded px-2.5 py-1.5 text-slate-100"
              />
            </div>
          </div>
          {accuracy !== undefined && (
            <div className="text-[10px] text-radar-subtle">
              GPS Accuracy Radius: <span className="text-radar-blue font-semibold">±{Math.round(accuracy)}m</span>
            </div>
          )}
        </div>

        {/* Location Label */}
        <div>
          <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-radar-teal" />
            LOCATION LABEL / ROOM NAME *
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Main Conference Room, 2nd Floor Corridor"
            className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500"
          />
        </div>

        {/* Wi-Fi RF Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-radar-teal" />
              SSID (NETWORK NAME)
            </label>
            <input
              type="text"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="e.g. Office_Corp_5G"
              className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-1.5 text-slate-100"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-radar-teal" />
              BAND & CHANNEL
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={band}
                onChange={(e) => setBand(e.target.value as "2.4 GHz" | "5 GHz" | "6 GHz")}
                className="bg-radar-bg border border-radar-border rounded-lg px-2 py-1.5 text-slate-100"
              >
                <option value="2.4 GHz">2.4 GHz</option>
                <option value="5 GHz">5 GHz</option>
                <option value="6 GHz">6 GHz</option>
              </select>
              <input
                type="number"
                value={channel || ""}
                onChange={(e) => setChannel(parseInt(e.target.value) || 0)}
                placeholder="Ch 36"
                className="bg-radar-bg border border-radar-border rounded-lg px-2 py-1.5 text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Signal Strength Slider (dBm) */}
        <div className="bg-radar-bg/80 p-3 rounded-lg border border-radar-border">
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-radar-teal" />
              SIGNAL STRENGTH (RSSI)
            </label>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold border ${rating.textClass} ${rating.borderClass} bg-radar-bg`}
            >
              {rssi} dBm ({rating.label})
            </span>
          </div>

          <input
            type="range"
            min="-95"
            max="-30"
            step="1"
            value={rssi}
            onChange={(e) => setRssi(parseInt(e.target.value))}
            className="w-full accent-radar-teal cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-radar-subtle mt-1 font-mono">
            <span>-95 dBm (Critical)</span>
            <span>-75 dBm (Fair)</span>
            <span>-50 dBm (Good)</span>
            <span>-30 dBm (Max)</span>
          </div>
        </div>

        {/* Live Latency Probe at this location */}
        <div className="p-3 bg-radar-bg/70 border border-radar-border rounded-lg flex items-center justify-between gap-2">
          <div>
            <div className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-radar-blue" />
              SPOT HTTP LATENCY
            </div>
            <div className="text-[10px] text-radar-subtle mt-0.5">
              {measuredLatency !== undefined
                ? `Measured: ${measuredLatency} ms`
                : "Measure live roundtrip latency at this spot"}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleMeasureSpotLatency}
            disabled={isTestingLatency}
            className="text-xs px-2.5 py-1.5 border-radar-teal/40 text-radar-teal hover:bg-radar-teal/10"
          >
            {isTestingLatency ? "Probing..." : measuredLatency ? "Re-Test" : "Run Test"}
          </Button>
        </div>

        {/* Notes */}
        <div>
          <label className="text-slate-300 block mb-1">NOTES / OBSERVATIONS (OPTIONAL)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Wall material, interference sources, antenna orientation..."
            className="w-full bg-radar-bg border border-radar-border rounded-lg p-2.5 text-slate-100 placeholder-slate-500 text-xs"
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex justify-end gap-2 border-t border-radar-border">
          <Button variant="outline" onClick={onClose} className="text-xs px-3 py-1.5">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-radar-teal hover:bg-radar-teal/90 text-slate-950 font-semibold text-xs px-4 py-1.5"
          >
            Save Survey Point
          </Button>
        </div>
      </div>
    </Modal>
  );
}
