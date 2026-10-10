"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GitCommit, Terminal, AlertOctagon, CheckCircle2 } from "lucide-react";

export function TracerouteHonestyView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <GitCommit className="w-4 h-4 text-radar-teal" />
            ICMP İzleme (Traceroute) & Yerel Paket Kaybı Tanılaması
          </CardTitle>
          <Badge variant="rose">Sandbox Kısıtlı</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-rose-200">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>Özellik Devre Dışı: Sahte Simülasyon Kesinlikle Yasaktır</span>
            </div>
            <p>
              NetRadar&apos;ın katı tanı dürüstlüğü politikası gereğince, sahte veya yapay olarak türetilmiş yönlendirme atlamaları (hop route) sunmak yerine bu yetenek kalıcı olarak devre dışı bırakılmıştır.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-radar-cyan" />
              Teknik Kök Neden & Protokol Sınırları
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-radar-bg border border-radar-border space-y-2">
                <span className="font-semibold text-slate-200 block font-mono text-[11px] uppercase">
                  1. Tarayıcı Güvenlik Modeli (W3C / WHATWG)
                </span>
                <p className="text-radar-muted leading-relaxed">
                  Web tarayıcıları (iOS Safari, Chrome ve Firefox dahil), JavaScript yürütmesini üst düzey bir uygulama kum havuzuna (sandbox) hapseder. Web API&apos;leri yalnızca HTTP fetch, WebSocket ve WebRTC veri kanallarını sunar.
                </p>
                <p className="text-radar-subtle">
                  Tarayıcılarda ham IP başlıkları oluşturma, paketlerin TTL (Time-To-Live) alanlarını manipüle etme veya ham ICMP Tip 11 (Süre Aşıldı) yanıtlarını yakalama arayüzü bulunmaz.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-radar-bg border border-radar-border space-y-2">
                <span className="font-semibold text-slate-200 block font-mono text-[11px] uppercase">
                  2. Sunucusuz Bulut Çalışma Zamanları (Vercel / Lambda)
                </span>
                <p className="text-radar-muted leading-relaxed">
                  Sunucusuz (serverless) barındırma mimarileri, <code className="text-radar-teal font-mono">CAP_NET_RAW</code> gibi Linux çekirdek yetkilerinin kaldırıldığı kilitli mikro sanal makinelerde (AWS Firecracker / V8 İzolatları) çalışır.
                </p>
                <p className="text-radar-subtle">
                  Bu ortamlarda <code className="text-radar-teal font-mono">socket(AF_INET, SOCK_RAW, IPPROTO_ICMP)</code> çağrısı doğrudan <code className="text-rose-400 font-mono">EPERM</code> (İşleme izin verilmedi) hatası döndürür.
                </p>
              </div>
            </div>
          </div>

          {/* Architecture comparison */}
          <div className="p-4 rounded-lg bg-radar-bg border border-radar-border space-y-3">
            <span className="text-xs font-semibold text-slate-200 block">
              NetRadar Bunun Yerine Ne Sunuyor?
            </span>
            <ul className="space-y-2 text-xs text-radar-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-radar-teal shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Gerçek HTTP Gecikmesi:</strong> <code className="text-radar-teal font-mono">performance.now()</code> üzerinden mikrosaniye hassasiyetli gerçek uygulama katmanı gidiş-dönüş süresi.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-radar-teal shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">DNS-over-HTTPS (DoH):</strong> Dünya çapındaki özyinelemeli çözümleyicilere karşı RFC standartlarında gerçek DNS kayıt sorguları ve gecikme ölçümü.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-radar-teal shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">TCP El Sıkışma Sondaları:</strong> NetRadar&apos;ın korumalı arka uç çalışma zamanı üzerinden gerçek Katman 4 TCP SYN/ACK süre ölçümü.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
