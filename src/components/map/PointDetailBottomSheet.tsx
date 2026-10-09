"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { WifiSurveyPoint } from "@/types/fieldMap";
import { getSignalRating } from "./signalUtils";
import { measureHttpLatency } from "@/lib/diagnostics/httpPing";
import { Trash2, Signal } from "lucide-react";

interface PointDetailBottomSheetProps {
  point: WifiSurveyPoint | null;
  onClose: () => void;
  onDeletePoint: (id: string) => void;
  onUpdatePoint?: (point: WifiSurveyPoint) => void;
}

export function PointDetailBottomSheet({
  point,
  onClose,
  onDeletePoint,
  onUpdatePoint,
}: PointDetailBottomSheetProps) {
  const [isTestingLatency, setIsTestingLatency] = useState(false);

  if (!point) return null;

  const rating = getSignalRating(point.rssi);

  const handleRetestLatency = async () => {
    setIsTestingLatency(true);
    try {
      const res = await measureHttpLatency("https://1.1.1.1/cdn-cgi/trace");
      if (res.durationMs > 0 && onUpdatePoint) {
        onUpdatePoint({
          ...point,
          httpLatencyMs: res.durationMs,
        });
      }
    } catch (err) {
      console.warn("Re-test latency failed:", err);
    } finally {
      setIsTestingLatency(false);
    }
  };

  return (
    <Modal isOpen={!!point} onClose={onClose} title={`Survey Point: ${point.label}`}>
      <div className="space-y-4 text-xs font-mono">
        {/* Signal Strength & Quality Banner */}
        <div className="bg-radar-bg p-3.5 rounded-lg border border-radar-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border font-bold text-lg"
              style={{
                borderColor: rating.color,
                color: rating.color,
                backgroundColor: `${rating.color}15`,
              }}
            >
              <Signal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-200 font-bold text-sm">
                {point.rssi !== undefined ? `${point.rssi} dBm` : "No RSSI Recorded"}
              </div>
              <div className="text-[11px]" style={{ color: rating.color }}>
                {rating.label} Quality
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((bar) => (
              <div
                key={bar}
                className="w-2 rounded-sm transition-all"
                style={{
                  height: `${bar * 5 + 6}px`,
                  backgroundColor: bar <= rating.bars ? rating.color : "#1E2D44",
                }}
              />
            ))}
          </div>
        </div>

        {/* Network & RF Parameters */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
            <span className="text-radar-subtle text-[10px] block mb-0.5">SSID</span>
            <span className="text-slate-200 font-semibold truncate block">
              {point.ssid || "Unspecified"}
            </span>
          </div>

          <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
            <span className="text-radar-subtle text-[10px] block mb-0.5">BAND / CHANNEL</span>
            <span className="text-slate-200 font-semibold block">
              {point.band || "Unknown"}{" "}
              {point.channel !== undefined ? `(Ch ${point.channel})` : ""}
            </span>
          </div>

          <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
            <span className="text-radar-subtle text-[10px] block mb-0.5">BSSID / MAC</span>
            <span className="text-slate-300 font-mono text-[11px] truncate block">
              {point.bssid || "N/A"}
            </span>
          </div>

          <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
            <span className="text-radar-subtle text-[10px] block mb-0.5">MEASUREMENT SOURCE</span>
            <span className="text-radar-teal uppercase text-[10px] font-semibold">
              {point.source}
            </span>
          </div>
        </div>

        {/* Spot Latency */}
        <div className="bg-radar-bg p-3 rounded-lg border border-radar-border flex items-center justify-between">
          <div>
            <div className="text-radar-subtle text-[10px]">SPOT HTTP LATENCY</div>
            <div className="text-slate-100 font-bold text-sm">
              {point.httpLatencyMs !== undefined ? `${point.httpLatencyMs} ms` : "Not measured"}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isTestingLatency}
            onClick={handleRetestLatency}
            className="text-xs px-2.5 py-1 border-radar-border hover:border-radar-teal text-slate-300"
          >
            {isTestingLatency ? "Probing..." : "Test Latency Now"}
          </Button>
        </div>

        {/* GPS Coordinates & Accuracy */}
        <div className="bg-radar-bg p-3 rounded-lg border border-radar-border space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-radar-subtle">GPS Coordinates:</span>
            <span className="text-slate-200 font-mono">
              {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
            </span>
          </div>
          {point.accuracyMeters !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-radar-subtle">GPS Accuracy Radius:</span>
              <span className="text-radar-blue">±{Math.round(point.accuracyMeters)}m</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-radar-subtle">Recorded At:</span>
            <span className="text-slate-400">
              {new Date(point.timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Notes */}
        {point.notes && (
          <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border text-[11px]">
            <span className="text-radar-subtle block mb-1">OBSERVATIONS & NOTES:</span>
            <p className="text-slate-300">{point.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-radar-border">
          <button
            type="button"
            onClick={() => {
              if (confirm("Are you sure you want to delete this survey point?")) {
                onDeletePoint(point.id);
                onClose();
              }
            }}
            className="text-red-400 hover:text-red-300 flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Point
          </button>

          <Button onClick={onClose} variant="outline" className="text-xs px-3.5 py-1.5">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
