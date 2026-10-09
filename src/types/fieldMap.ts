export type MeasurementSource = "manual" | "imported" | "browser-observed";

export interface WifiSurveyPoint {
  id: string;
  timestamp: number;
  lat: number;
  lng: number;
  accuracyMeters?: number;
  label: string; // Location note (e.g. "Main Office", "Rack 4", "Living Room")
  source: MeasurementSource;

  // Wi-Fi RF Parameters (when recorded manually or imported from external analyzer)
  ssid?: string;
  bssid?: string;
  rssi?: number; // Signal strength in dBm (e.g. -45 dBm)
  band?: "2.4 GHz" | "5 GHz" | "6 GHz" | "Unknown";
  channel?: number;
  vendor?: string;

  // Network Quality metrics
  httpLatencyMs?: number;
  downlinkEstimateMbps?: number;
  notes?: string;
}

export interface CellularTower {
  id: string;
  lat: number;
  lng: number;
  mcc?: number;
  mnc?: number;
  lac?: number;
  cellId?: number;
  radio?: "GSM" | "UMTS" | "LTE" | "NR";
  rangeMeters?: number;
  samples?: number;
  operator?: string;
  source: string;
}

export interface TowerDistanceResult {
  tower: CellularTower;
  distanceMeters: number;
  distanceKm: number;
}
