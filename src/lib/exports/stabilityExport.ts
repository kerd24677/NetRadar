import { StabilitySession } from "@/types/stability";
import { WifiSurveyPoint } from "@/types/fieldMap";
import { escapeCsvCell, sanitizeTargetForExport } from "./csvExport";

export function generateStabilityCsv(session: StabilitySession): string {
  const headers = [
    "Seq",
    "Timestamp_ISO",
    "Target",
    "Latency_ms",
    "Status",
    "HTTP_Status",
    "Error_Details",
  ];

  const rows = session.points.map((p) => [
    p.seq,
    escapeCsvCell(new Date(p.timestamp).toISOString()),
    escapeCsvCell(sanitizeTargetForExport(p.target)),
    p.durationMs,
    escapeCsvCell(p.status),
    p.httpStatus || "",
    escapeCsvCell(p.errorDetails || ""),
  ].join(","));

  return [headers.join(","), ...rows].join("\r\n");
}

export function generateFieldSurveyCsv(points: WifiSurveyPoint[]): string {
  const headers = [
    "ID",
    "Timestamp_ISO",
    "Latitude",
    "Longitude",
    "Accuracy_m",
    "Label",
    "Source",
    "SSID",
    "BSSID",
    "RSSI_dBm",
    "Band",
    "Channel",
    "HTTP_Latency_ms",
    "Notes",
  ];

  const rows = points.map((p) => [
    escapeCsvCell(p.id),
    escapeCsvCell(new Date(p.timestamp).toISOString()),
    p.lat,
    p.lng,
    p.accuracyMeters || "",
    escapeCsvCell(p.label || ""),
    escapeCsvCell(p.source),
    escapeCsvCell(p.ssid || ""),
    escapeCsvCell(p.bssid || ""),
    p.rssi !== undefined ? p.rssi : "",
    escapeCsvCell(p.band || ""),
    p.channel !== undefined ? p.channel : "",
    p.httpLatencyMs !== undefined ? p.httpLatencyMs : "",
    escapeCsvCell(p.notes || ""),
  ].join(","));

  return [headers.join(","), ...rows].join("\r\n");
}

export function generateFieldSurveyGeoJson(points: WifiSurveyPoint[]): string {
  const features = points.map((p) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [p.lng, p.lat],
    },
    properties: {
      id: p.id,
      timestamp: new Date(p.timestamp).toISOString(),
      label: p.label,
      source: p.source,
      ssid: p.ssid,
      rssi: p.rssi,
      band: p.band,
      channel: p.channel,
      httpLatencyMs: p.httpLatencyMs,
      notes: p.notes,
    },
  }));

  return JSON.stringify(
    {
      type: "FeatureCollection",
      features,
    },
    null,
    2
  );
}

export function downloadJsonFile(arg1: unknown, arg2: unknown): void {
  if (typeof window === "undefined") return;

  let filename = "export.json";
  let rawData: unknown = arg1;

  if (typeof arg1 === "string" && (arg1.endsWith(".json") || arg1.endsWith(".geojson"))) {
    filename = arg1;
    rawData = arg2;
  } else if (typeof arg2 === "string") {
    filename = arg2;
    rawData = arg1;
  }

  const content = typeof rawData === "string" ? rawData : JSON.stringify(rawData, null, 2);
  const blob = new Blob([content], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
