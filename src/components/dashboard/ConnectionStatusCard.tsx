"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Activity, Info } from "lucide-react";

export function ConnectionStatusCard() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    supported: boolean;
  }>({ supported: false });

  useEffect(() => {
    setIsOnline(navigator.onLine);

    function updateOnline() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    const nav = navigator as unknown as {
      connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
        addEventListener?: (type: string, listener: () => void) => void;
      };
    };

    if (nav.connection) {
      setConnectionInfo({
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
        rtt: nav.connection.rtt,
        saveData: nav.connection.saveData,
        supported: true,
      });

      const handleConnChange = () => {
        if (nav.connection) {
          setConnectionInfo({
            effectiveType: nav.connection.effectiveType,
            downlink: nav.connection.downlink,
            rtt: nav.connection.rtt,
            saveData: nav.connection.saveData,
            supported: true,
          });
        }
      };

      nav.connection.addEventListener?.("change", handleConnChange);
    } else {
      setConnectionInfo({ supported: false });
    }

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Activity className="w-4 h-4 text-radar-teal" />
          Tarayıcı Ağ Telemetrisi
        </CardTitle>
        <Badge variant={isOnline ? "teal" : "rose"} pulse={isOnline}>
          {isOnline ? "ÇEVRİMİÇİ (İŞARET)" : "ÇEVRİMDIŞI"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Advisory disclaimer */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-radar-elevated/60 border border-radar-border text-xs text-radar-muted">
          <Info className="w-4 h-4 text-radar-cyan shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-200">İşletim Sistemi Ağ İpucu:</strong> Tarayıcı{" "}
            <code className="text-radar-teal font-mono">navigator.onLine</code> bayrağı yerel ağ arayüzünün durumunu yansıtır. Doğrudan genel internet veya ağ geçidi erişilebilirliğini garanti etmez.
          </p>
        </div>

        {/* Network Information API Hints */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              Etkin Ağ Profili
            </span>
            <span className="text-base font-semibold text-slate-100 font-mono mt-0.5 block">
              {connectionInfo.supported && connectionInfo.effectiveType
                ? connectionInfo.effectiveType.toUpperCase()
                : "Açıklanmıyor"}
            </span>
            <span className="text-[10px] text-radar-muted">
              {connectionInfo.supported
                ? "Sezgisel sınıf (NetworkInfo)"
                : "iOS Safari / WebKit'te kısıtlı"}
            </span>
          </div>

          <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              Tahmini İndirme Hızı
            </span>
            <span className="text-base font-semibold text-slate-100 font-mono mt-0.5 block">
              {connectionInfo.supported && connectionInfo.downlink !== undefined
                ? `${connectionInfo.downlink} Mbps`
                : "Açıklanmıyor"}
            </span>
            <span className="text-[10px] text-radar-muted">
              {connectionInfo.supported ? "Tarayıcı tahmini" : "iOS Safari / WebKit'te kısıtlı"}
            </span>
          </div>

          <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              Tahmini RTT Gecikmesi
            </span>
            <span className="text-base font-semibold text-slate-100 font-mono mt-0.5 block">
              {connectionInfo.supported && connectionInfo.rtt !== undefined
                ? `${connectionInfo.rtt} ms`
                : "Açıklanmıyor"}
            </span>
            <span className="text-[10px] text-radar-muted">
              {connectionInfo.supported ? "Tarayıcı tahmini" : "iOS WebKit'te kullanılamaz"}
            </span>
          </div>

          <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
            <span className="text-[11px] font-mono text-radar-subtle uppercase block">
              Veri Tasarrufu Modu
            </span>
            <span className="text-base font-semibold text-slate-100 font-mono mt-0.5 block">
              {connectionInfo.supported && connectionInfo.saveData !== undefined
                ? connectionInfo.saveData ? "Etkin" : "Devre Dışı"
                : "Açıklanmıyor"}
            </span>
            <span className="text-[10px] text-radar-muted">
              {connectionInfo.supported ? "İstemci tercihi" : "İstemci tercihi yok"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
