import { describe, it, expect } from "vitest";
import {
  generateStabilityCsv,
  generateFieldSurveyCsv,
  generateFieldSurveyGeoJson,
} from "./stabilityExport";
import { StabilitySession } from "@/types/stability";
import { WifiSurveyPoint } from "@/types/fieldMap";

describe("stabilityExport", () => {
  it("should generate stability CSV with headers and redacted sensitive query params", () => {
    const session: StabilitySession = {
      id: "sess_1",
      target: "https://api.internal.corp/status?token=secret999&user=admin",
      intervalMs: 1000,
      startTime: 1600000000000,
      status: "completed",
      stats: {
        totalSent: 1,
        completedCount: 1,
        failedCount: 0,
        failureRatio: 0,
        consecutiveFailures: 0,
        maxConsecutiveFailures: 0,
        minLatency: 45,
        maxLatency: 45,
        meanLatency: 45,
        medianLatency: 45,
        p95Latency: 45,
        jitter: 0,
        outageCount: 0,
        outages: [],
      },
      points: [
        {
          id: "pt_1",
          seq: 1,
          timestamp: 1600000000000,
          target: "https://api.internal.corp/status?token=secret999&user=admin",
          durationMs: 45.5,
          status: "success",
          httpStatus: 200,
        },
      ],
    };

    const csv = generateStabilityCsv(session);
    expect(csv).toContain("Seq,Timestamp_ISO,Target,Latency_ms,Status,HTTP_Status,Error_Details");
    expect(csv).not.toContain("secret999");
    expect(csv).toContain("REDACTED");
    expect(csv).toContain("45.5");
  });

  it("should generate field survey CSV and neutralize formula injection in labels/notes", () => {
    const points: WifiSurveyPoint[] = [
      {
        id: "pt_survey_1",
        timestamp: 1600000000000,
        lat: 41.0082,
        lng: 28.9784,
        accuracyMeters: 5,
        label: "=SUM(1+1)",
        source: "manual",
        ssid: "Corp_Wifi",
        rssi: -55,
        band: "5 GHz",
        channel: 36,
        httpLatencyMs: 32.1,
        notes: "+cmd|calc",
      },
    ];

    const csv = generateFieldSurveyCsv(points);
    expect(csv).toContain("ID,Timestamp_ISO,Latitude,Longitude,Accuracy_m,Label,Source,SSID,BSSID,RSSI_dBm,Band,Channel,HTTP_Latency_ms,Notes");
    expect(csv).toContain("41.0082,28.9784");
    expect(csv).toContain("\"'=SUM(1+1)\"");
    expect(csv).toContain("\"'+cmd|calc\"");
    expect(csv).toContain("-55");
  });

  it("should generate valid GeoJSON FeatureCollection with [lng, lat] point geometry", () => {
    const points: WifiSurveyPoint[] = [
      {
        id: "pt_geo_1",
        timestamp: 1600000000000,
        lat: 41.0082,
        lng: 28.9784,
        accuracyMeters: 3,
        label: "Lobby",
        source: "manual",
        ssid: "Guest_WiFi",
        rssi: -62,
        band: "5 GHz",
        channel: 44,
      },
    ];

    const geoJsonStr = generateFieldSurveyGeoJson(points);
    const parsed = JSON.parse(geoJsonStr);

    expect(parsed.type).toBe("FeatureCollection");
    expect(parsed.features).toHaveLength(1);
    expect(parsed.features[0].geometry.type).toBe("Point");
    // GeoJSON standard dictates [longitude, latitude]
    expect(parsed.features[0].geometry.coordinates).toEqual([28.9784, 41.0082]);
    expect(parsed.features[0].properties.label).toBe("Lobby");
    expect(parsed.features[0].properties.rssi).toBe(-62);
  });
});
