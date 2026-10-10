"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldX } from "lucide-react";

export function NativeHardwareNoticeCard() {
  const restrictedMetrics = [
    {
      metric: "Wi-Fi Sinyal Şiddeti (RSSI / dBm)",
      reason: "CoreWLAN / NetworkExtension sistem yetkisi gerektirir. WebKit, iç mekan konum takibini engellemek için doğrudan RF erişimini yasaklar.",
    },
    {
      metric: "Erişim Noktası BSSID & Kanal",
      reason: "BSSID küresel bir coğrafi tanımlayıcıdır; Apple, aktif Konum Servisi izinleri ve yerel uygulama imzası olmadan erişimi engeller.",
    },
    {
      metric: "Hücresel RSRP / RSRQ / Baz İstasyonu ID",
      reason: "CoreTelephony modem tanıları yalnızca imzalı yerel iOS operatör paketlerine ayrılmıştır.",
    },
    {
      metric: "Çekirdek Yönlendirme Tablosu & ARP Önbelleği",
      reason: "Web kum havuzu sysctl/procfs soketlerine veya doğrudan arayüz ARP çözümlemesine erişim izni vermez.",
    },
    {
      metric: "Ham Paket Yakalama (PCAP / Wireshark)",
      reason: "Ham BPF (Berkeley Packet Filter) aygıtları gerektirir; tarayıcı çalıştırma ortamlarından yürütülemez.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <ShieldX className="w-4 h-4 text-radar-amber" />
          Mobil İşletim Sistemi Güvenlik Kum Havuzu Sınırları (iOS Safari &amp; WebKit)
        </CardTitle>
        <Badge variant="amber">Sıkı Platform İzolasyonu</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-radar-muted leading-relaxed">
          Profesyonel bir ağ analiz platformu olarak NetRadar tam teknik şeffaflık sağlar. Aşağıdaki düşük seviyeli telekomünikasyon parametrelerine işletim sistemi güvenlik politikası nedeniyle web uygulamaları tarafından doğrudan erişilemez:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {restrictedMetrics.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-radar-bg border border-radar-border space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-radar-amber shrink-0" />
                <span className="text-xs font-semibold text-slate-200">{item.metric}</span>
              </div>
              <p className="text-[11px] text-radar-subtle leading-relaxed pl-3.5">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
