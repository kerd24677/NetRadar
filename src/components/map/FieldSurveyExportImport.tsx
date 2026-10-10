"use client";

import React, { useRef } from "react";
import { WifiSurveyPoint } from "@/types/fieldMap";
import {
  generateFieldSurveyCsv,
  generateFieldSurveyGeoJson,
  downloadJsonFile,
} from "@/lib/exports/stabilityExport";
import { downloadCsvFile } from "@/lib/exports/csvExport";
import { Button } from "@/components/ui/Button";
import {
  Upload,
  FileSpreadsheet,
  FileCode,
  Trash2,
} from "lucide-react";

interface FieldSurveyExportImportProps {
  points: WifiSurveyPoint[];
  onImportPoints: (points: WifiSurveyPoint[]) => void;
  onClearPoints: () => void;
}

/**
 * RFC-4180 CSV parser respecting quoted commas.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

export function FieldSurveyExportImport({
  points,
  onImportPoints,
  onClearPoints,
}: FieldSurveyExportImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCsv = () => {
    if (points.length === 0) return;
    const csv = generateFieldSurveyCsv(points);
    downloadCsvFile(csv, `netradar-survey-${Date.now()}.csv`);
  };

  const handleExportGeoJson = () => {
    if (points.length === 0) return;
    const geoJson = generateFieldSurveyGeoJson(points);
    downloadJsonFile(geoJson, `netradar-survey-${Date.now()}.geojson`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        // Try parsing JSON or GeoJSON
        if (file.name.endsWith(".json") || file.name.endsWith(".geojson")) {
          const parsed = JSON.parse(text);
          const importedPoints: WifiSurveyPoint[] = [];

          if (parsed.type === "FeatureCollection" && Array.isArray(parsed.features)) {
            // GeoJSON format with defensive validation
            interface GeoJsonFeature {
              geometry?: {
                type?: string;
                coordinates?: [number, number];
              };
              properties?: {
                timestamp?: number | string;
                accuracyMeters?: number;
                label?: string;
                ssid?: string;
                bssid?: string;
                rssi?: number;
                band?: "2.4 GHz" | "5 GHz" | "6 GHz" | "Unknown";
                channel?: number;
                httpLatencyMs?: number;
                notes?: string;
              };
            }

            for (let idx = 0; idx < parsed.features.length; idx++) {
              const f = parsed.features[idx] as GeoJsonFeature;
              if (
                f &&
                f.geometry &&
                Array.isArray(f.geometry.coordinates) &&
                f.geometry.coordinates.length >= 2
              ) {
                const lng = Number(f.geometry.coordinates[0]);
                const lat = Number(f.geometry.coordinates[1]);

                // Validate coordinate ranges
                if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                  const rawRssi = f.properties?.rssi !== undefined ? Number(f.properties.rssi) : undefined;
                  const validatedRssi =
                    rawRssi !== undefined && !isNaN(rawRssi) && rawRssi <= 0 && rawRssi >= -130
                      ? rawRssi
                      : undefined;

                  const rawTs = f.properties?.timestamp;
                  const parsedTs =
                    typeof rawTs === "number"
                      ? rawTs
                      : typeof rawTs === "string"
                      ? new Date(rawTs).getTime() || Date.now()
                      : Date.now();

                  importedPoints.push({
                    id: `imported_geo_${Date.now()}_${idx}`,
                    timestamp: parsedTs,
                    lat,
                    lng,
                    accuracyMeters:
                      f.properties?.accuracyMeters && f.properties.accuracyMeters > 0
                        ? Number(f.properties.accuracyMeters)
                        : undefined,
                    label: String(f.properties?.label || `Survey Fix #${idx + 1}`).replace(/^[=+\-@]/, ""),
                    source: "imported",
                    ssid: f.properties?.ssid ? String(f.properties.ssid).replace(/^[=+\-@]/, "") : undefined,
                    bssid: f.properties?.bssid ? String(f.properties.bssid) : undefined,
                    rssi: validatedRssi,
                    band: f.properties?.band,
                    channel: f.properties?.channel ? Number(f.properties.channel) : undefined,
                    httpLatencyMs:
                      f.properties?.httpLatencyMs && Number(f.properties.httpLatencyMs) > 0
                        ? Number(f.properties.httpLatencyMs)
                        : undefined,
                    notes: f.properties?.notes ? String(f.properties.notes).replace(/^[=+\-@]/, "") : undefined,
                  });
                }
              }
            }
          } else if (Array.isArray(parsed)) {
            // Raw JSON array of points with bounds check
            for (let idx = 0; idx < parsed.length; idx++) {
              const p = parsed[idx];
              if (p && typeof p.lat === "number" && typeof p.lng === "number") {
                if (p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180) {
                  importedPoints.push({
                    ...p,
                    id: p.id || `imported_json_${Date.now()}_${idx}`,
                    source: "imported",
                    label: String(p.label || `Fix #${idx + 1}`).replace(/^[=+\-@]/, ""),
                  });
                }
              }
            }
          }

          if (importedPoints.length > 0) {
            onImportPoints(importedPoints);
            alert(`Successfully imported ${importedPoints.length} valid survey points.`);
          } else {
            alert("No valid survey points with geographic coordinates found in file.");
          }
        } else {
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length > 1) {
            const imported: WifiSurveyPoint[] = [];
            // Parse data rows
            for (let i = 1; i < lines.length; i++) {
              const parts = parseCsvLine(lines[i]);
              if (parts.length >= 4) {
                const lat = parseFloat(parts[2]);
                const lng = parseFloat(parts[3]);

                if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                  const rawBand = parts[10];
                  const parsedBand =
                    rawBand === "2.4 GHz" || rawBand === "5 GHz" || rawBand === "6 GHz"
                      ? rawBand
                      : undefined;

                  const rawRssi = parseInt(parts[9]);
                  const validatedRssi =
                    !isNaN(rawRssi) && rawRssi <= 0 && rawRssi >= -130 ? rawRssi : undefined;

                  imported.push({
                    id: `imported_csv_${Date.now()}_${i}`,
                    timestamp: parts[1] ? new Date(parts[1]).getTime() || Date.now() : Date.now(),
                    lat,
                    lng,
                    accuracyMeters: parts[4] && parseFloat(parts[4]) > 0 ? parseFloat(parts[4]) : undefined,
                    label: (parts[5] || `Point ${i}`).replace(/^[=+\-@]/, ""),
                    source: "imported",
                    ssid: parts[7] ? parts[7].replace(/^[=+\-@]/, "") : undefined,
                    bssid: parts[8] || undefined,
                    rssi: validatedRssi,
                    band: parsedBand,
                    channel: parts[11] && parseInt(parts[11]) > 0 ? parseInt(parts[11]) : undefined,
                    httpLatencyMs:
                      parts[12] && parseFloat(parts[12]) > 0 ? parseFloat(parts[12]) : undefined,
                    notes: parts[13] ? parts[13].replace(/^[=+\-@]/, "") : undefined,
                  });
                }
              }
            }

            if (imported.length > 0) {
              onImportPoints(imported);
              alert(`${imported.length} adet saha ölçüm noktası CSV dosyasından başarıyla içe aktarıldı!`);
            } else {
              alert("CSV biçiminden geçerli ölçüm noktaları çıkarılamadı.");
            }
          }
        }
      } catch (err) {
        alert("Saha dosyası ayrıştırılamadı: " + (err as Error).message);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-radar-surface/90 border border-radar-border rounded-xl p-4 sm:p-5 shadow-noc-card flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.geojson"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div>
        <span className="font-semibold text-slate-200 block">SAHA VERİSİ TAŞINABİLİRLİĞİ</span>
        <span className="text-radar-subtle text-[11px]">
          GIS/GeoJSON formatında dışa aktarın veya harici Wi-Fi analiz izlerini içe aktarın
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="border-radar-border hover:bg-radar-bg text-slate-300 text-xs px-2.5 py-1.5 flex items-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5 text-radar-teal" />
          Dosya İçe Aktar
        </Button>

        <Button
          type="button"
          onClick={handleExportCsv}
          disabled={points.length === 0}
          variant="outline"
          className="border-radar-border hover:bg-radar-bg text-slate-300 text-xs px-2.5 py-1.5 flex items-center gap-1.5 disabled:opacity-40"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-radar-teal" />
          CSV Dışa Aktar
        </Button>

        <Button
          type="button"
          onClick={handleExportGeoJson}
          disabled={points.length === 0}
          variant="outline"
          className="border-radar-border hover:bg-radar-bg text-slate-300 text-xs px-2.5 py-1.5 flex items-center gap-1.5 disabled:opacity-40"
        >
          <FileCode className="w-3.5 h-3.5 text-radar-blue" />
          GeoJSON Dışa Aktar
        </Button>

        {points.length > 0 && (
          <Button
            type="button"
            onClick={() => {
              if (confirm("Tüm saha ölçüm noktalarını silmek istediğinize emin misiniz?")) {
                onClearPoints();
              }
            }}
            variant="outline"
            className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs px-2.5 py-1.5 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Temizle
          </Button>
        )}
      </div>
    </div>
  );
}
