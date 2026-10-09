export interface SignalRating {
  color: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  label: string;
  quality: "Excellent" | "Good" | "Fair" | "Poor" | "Critical" | "Unknown";
  bars: number;
}

/**
 * Maps Wi-Fi RSSI (dBm) to industry-standard RF color coding and quality indicators.
 * - Green: > -50 dBm
 * - Light green: -50 to -65 dBm
 * - Amber: -65 to -75 dBm
 * - Orange: -75 to -85 dBm
 * - Red: < -85 dBm
 */
export function getSignalRating(rssi?: number): SignalRating {
  if (rssi === undefined || rssi === null) {
    return {
      color: "#94A3B8",
      borderClass: "border-slate-500",
      bgClass: "bg-slate-500",
      textClass: "text-slate-400",
      label: "No RSSI",
      quality: "Unknown",
      bars: 0,
    };
  }

  if (rssi > -50) {
    return {
      color: "#10B981",
      borderClass: "border-emerald-500",
      bgClass: "bg-emerald-500",
      textClass: "text-emerald-400",
      label: "Excellent",
      quality: "Excellent",
      bars: 5,
    };
  }

  if (rssi >= -65) {
    return {
      color: "#34D399",
      borderClass: "border-emerald-400",
      bgClass: "bg-emerald-400",
      textClass: "text-emerald-300",
      label: "Good",
      quality: "Good",
      bars: 4,
    };
  }

  if (rssi >= -75) {
    return {
      color: "#FBBF24",
      borderClass: "border-amber-400",
      bgClass: "bg-amber-400",
      textClass: "text-amber-300",
      label: "Fair",
      quality: "Fair",
      bars: 3,
    };
  }

  if (rssi >= -85) {
    return {
      color: "#F97316",
      borderClass: "border-orange-500",
      bgClass: "bg-orange-500",
      textClass: "text-orange-400",
      label: "Poor",
      quality: "Poor",
      bars: 2,
    };
  }

  return {
    color: "#EF4444",
    borderClass: "border-red-500",
    bgClass: "bg-red-500",
    textClass: "text-red-400",
    label: "Critical",
    quality: "Critical",
    bars: 1,
  };
}
