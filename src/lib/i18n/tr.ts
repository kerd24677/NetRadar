/**
 * NetRadar - Kapsamlı Türkçe Yerelleştirme ve Ağ Terminolojisi Sözlüğü
 * Standart Türk Ağ Mühendisliği ve NOC terimlerine uygun olarak yapılandırılmıştır.
 */

export const TR = {
  app: {
    name: "NETRADAR",
    tagline: "Profesyonel Ağ Analiz ve Tanılama Laboratuvarı",
    nocVersion: "NOC v2.0",
    pwaMode: "PWA Modu",
    statusOnline: "ÇEVRİMİÇİ",
    statusOffline: "ÇEVRİMDIŞI",
    browserReportsOnline: "Tarayıcı bağlantısı etkin (navigator.onLine = true)",
    browserReportsOffline: "İnternet bağlantısı koptu (navigator.onLine = false)",
  },

  nav: {
    overview: "Genel Bakış",
    overviewDesc: "NOC kontrol paneli ve canlı telemetri",
    topology: "Ağ Topolojisi",
    topologyDesc: "Etkileşimli düğüm haritası ve veri akışı",
    diagnostics: "Tanılama",
    diagnosticsDesc: "HTTP, DNS, Hız ve TCP port matrisi",
    stability: "Kararlılık",
    stabilityDesc: "Gecikme değişimi, yüzdelikler ve kesinti analizi",
    map: "Saha Haritası",
    mapDesc: "Wi-Fi RF tarama ve baz istasyonu kuleleri",
    network: "Ağ Bilgisi",
    networkDesc: "İstemci IP, sezgisel analiz ve WebRTC",
    history: "Kayıt Geçmişi",
    historyDesc: "Yerel IndexedDB telemetri günlüğü",
    settings: "Ayarlar",
    settingsDesc: "DoH çözümleyiciler ve iOS PWA kurulumu",
    localIsolation: "Yerel Kasa İzolasyonu",
    localIsolationDesc: "Tüm tanılama kayıtları yalnızca cihazınızın IndexedDB deposunda saklanır. Üçüncü taraflara hiçbir telemetri iletilmez.",
  },

  actions: {
    start: "Başlat",
    stop: "Durdur",
    retry: "Yeniden Dene",
    clear: "Temizle",
    filter: "Filtrele",
    exportCsv: "CSV Dışa Aktar",
    exportJson: "JSON Dışa Aktar",
    exportGeoJson: "GeoJSON Dışa Aktar",
    importFile: "İçe Aktar",
    save: "Kaydet",
    delete: "Sil",
    details: "Ayrıntılar",
    close: "Kapat",
    back: "Geri",
    refresh: "Yenile",
    addPoint: "Nokta Ekle",
    fullAudit: "Kapsamlı NOC Denetimi Başlat",
    resetView: "Görünümü Sıfırla",
    inspect: "İncele",
    zoomIn: "Yakınlaştır",
    zoomOut: "Uzaklaştır",
  },

  status: {
    success: "Başarılı",
    warning: "Uyarı",
    error: "Hata",
    timeout: "Zaman Aşımı",
    offline: "Çevrimdışı",
    running: "Çalışıyor",
    stopped: "Durduruldu",
    completed: "Tamamlandı",
    pending: "Beklemede",
    idle: "Hazır",
    open: "Açık",
    closed: "Kapalı",
    forbidden: "Erişim Engellendi (CORS/Güvenlik Duvarı)",
  },

  metrics: {
    latency: "Gecikme (ms)",
    roundTripTime: "Gidiş-Dönüş Süresi (RTT)",
    jitter: "Gecikme Değişimi (RFC 3550 MAD)",
    packetLoss: "HTTP Başarısızlık Oranı",
    outage: "Hizmet Kesintisi",
    outages: "Hizmet Kesintileri",
    throughput: "Veri Aktarım Hızı",
    bandwidth: "Bant Genişliği",
    download: "İndirme",
    upload: "Yükleme",
    gateway: "Ağ Geçidi",
    resolver: "DNS Çözümleyici",
    target: "Hedef Uç Nokta",
    duration: "Süre",
    consecutiveFailures: "Ardışık Başarısız İstekler",
    minLatency: "Minimum Gecikme",
    maxLatency: "Maksimum Gecikme",
    meanLatency: "Ortalama Gecikme",
    medianLatency: "Medyan Gecikme (P50)",
    p95Latency: "P95 Gecikme Süresi",
    p99Latency: "P99 Gecikme Süresi",
    signalStrength: "Sinyal Şiddeti (RSSI)",
    frequencyBand: "Frekans Bandı",
    channel: "Kanal",
    sampleCount: "Örnek Sayısı",
    coverageQuality: "Kapsama Kalitesi",
    distance: "Mesafe",
    coordinates: "Koordinatlar",
  },

  rf: {
    manualEntry: "Manuel Kayıt",
    importedSurvey: "İçe Aktarılan Ölçüm",
    browserObserved: "Tarayıcı Gözlemi",
    cellTower: "Baz İstasyonu Kulesi",
    cellTowers: "Baz İstasyonu Referans Kuleleri",
    excellent: "Mükemmel",
    good: "İyi",
    fair: "Orta",
    poor: "Zayıf",
  },

  disclaimers: {
    wifiSandbox: "Web tarayıcı güvenlik kum havuzu (sandbox) politikaları nedeniyle istemci donanımının ham Wi-Fi çipine erişilemez. Sinyal (RSSI) ve SSID verileri yalnızca saha teknisyeni tarafından manuel kaydedilen veya harici analiz cihazlarından içe aktarılan kayıtlardan oluşur.",
    httpVsIcmp: "Modern tarayıcılarda ham ICMP/IP soketleri mevcut değildir. 'Gecikme' ve 'Başarısızlık Oranı' metrikleri gerçek HTTP/HTTPS istek süreleri ve hata kodları üzerinden hesaplanır.",
    speedTest: "Hız ölçümü, sunucusuz kenar (edge) uç noktalarla yapılan gerçek HTTP veri akışına dayanır. Tarayıcı önbelleği ve SSL el sıkışması ek yükleri hesaba katılır.",
    webrtc: "WebRTC yerel IP keşfi, iOS ve modern tarayıcıların mDNS gizlilik maskelemesi nedeniyle rastgele UUID (.local) olarak görüntülenebilir.",
    sampleTowers: "Görüntülenen baz istasyonu konumları kamuya açık OpenCelliD/kamu veritabanı referans kayıtlarıdır. Cihazınızın bağlı olduğu kuleyi kesin olarak yansıtmayabilir.",
  },
} as const;

/**
 * Sinyal seviyesi (dBm) Türkçe derecelendirme yardımcısı
 */
export function getSignalRatingTr(rssi?: number): {
  label: string;
  color: string;
  glowColor: string;
  bgClass: string;
  borderClass: string;
} {
  if (rssi === undefined || isNaN(rssi)) {
    return {
      label: "Belirtilmemiş",
      color: "#94A3B8",
      glowColor: "rgba(148, 163, 184, 0.4)",
      bgClass: "bg-slate-500/10",
      borderClass: "border-slate-500/30",
    };
  }
  if (rssi >= -50) {
    return {
      label: "Mükemmel",
      color: "#10B981",
      glowColor: "rgba(16, 185, 129, 0.6)",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/30",
    };
  }
  if (rssi >= -65) {
    return {
      label: "İyi",
      color: "#00F0FF",
      glowColor: "rgba(0, 240, 255, 0.6)",
      bgClass: "bg-cyan-500/10",
      borderClass: "border-cyan-500/30",
    };
  }
  if (rssi >= -75) {
    return {
      label: "Orta",
      color: "#F59E0B",
      glowColor: "rgba(245, 158, 11, 0.6)",
      bgClass: "bg-amber-500/10",
      borderClass: "border-amber-500/30",
    };
  }
  return {
    label: "Zayıf",
    color: "#F43F5E",
    glowColor: "rgba(244, 63, 94, 0.6)",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-500/30",
  };
}

/**
 * Gecikme süresi (ms) Türkçe derecelendirme yardımcısı
 */
export function getLatencyRatingTr(ms: number): {
  label: string;
  color: string;
  tier: "low" | "medium" | "high" | "critical";
} {
  if (ms < 50) {
    return { label: "Çok İyi (<50ms)", color: "#10B981", tier: "low" };
  }
  if (ms < 100) {
    return { label: "İyi (50-100ms)", color: "#00F0FF", tier: "low" };
  }
  if (ms < 200) {
    return { label: "Orta (100-200ms)", color: "#F59E0B", tier: "medium" };
  }
  return { label: "Yüksek (>200ms)", color: "#F43F5E", tier: "high" };
}
