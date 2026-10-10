export interface SignalRating {
  color: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  label: string;
  quality: "Excellent" | "Good" | "Fair" | "Poor" | "Critical" | "Unknown";
  qualityTr: "Mükemmel" | "İyi" | "Orta" | "Zayıf" | "Kritik" | "Belirtilmemiş";
  bars: number;
}

/**
 * Wi-Fi RSSI (dBm) değerini endüstri standardı RF renklerine ve Türkçe etiketlerine dönüştürür.
 * - Neon Yeşil/Zümrüt: > -50 dBm (Mükemmel)
 * - Neon Camgöbeği/Turkuaz: -50 ila -65 dBm (İyi)
 * - Neon Amber/Sarı: -65 ila -75 dBm (Orta)
 * - Neon Turuncu: -75 ila -85 dBm (Zayıf)
 * - Neon Kırmızı/Magenta: < -85 dBm (Kritik)
 */
export function getSignalRating(rssi?: number): SignalRating {
  if (rssi === undefined || rssi === null) {
    return {
      color: "#94A3B8",
      borderClass: "border-slate-500",
      bgClass: "bg-slate-500",
      textClass: "text-slate-400",
      label: "Belirtilmemiş",
      quality: "Unknown",
      qualityTr: "Belirtilmemiş",
      bars: 0,
    };
  }

  if (rssi > -50) {
    return {
      color: "#10B981",
      borderClass: "border-emerald-500",
      bgClass: "bg-emerald-500",
      textClass: "text-emerald-400",
      label: "Mükemmel",
      quality: "Excellent",
      qualityTr: "Mükemmel",
      bars: 5,
    };
  }

  if (rssi >= -65) {
    return {
      color: "#00F0FF",
      borderClass: "border-cyan-400",
      bgClass: "bg-cyan-500",
      textClass: "text-cyan-300",
      label: "İyi",
      quality: "Good",
      qualityTr: "İyi",
      bars: 4,
    };
  }

  if (rssi >= -75) {
    return {
      color: "#FBBF24",
      borderClass: "border-amber-400",
      bgClass: "bg-amber-400",
      textClass: "text-amber-300",
      label: "Orta",
      quality: "Fair",
      qualityTr: "Orta",
      bars: 3,
    };
  }

  if (rssi >= -85) {
    return {
      color: "#F97316",
      borderClass: "border-orange-500",
      bgClass: "bg-orange-500",
      textClass: "text-orange-400",
      label: "Zayıf",
      quality: "Poor",
      qualityTr: "Zayıf",
      bars: 2,
    };
  }

  return {
    color: "#FF2E93",
    borderClass: "border-rose-500",
    bgClass: "bg-rose-500",
    textClass: "text-rose-400",
    label: "Kritik",
    quality: "Critical",
    qualityTr: "Kritik",
    bars: 1,
  };
}
