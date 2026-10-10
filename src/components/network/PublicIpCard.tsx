"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Globe, RefreshCw } from "lucide-react";

interface IpResponse {
  ip: string;
  version: "IPv4" | "IPv6" | "Unknown";
  userAgent: string;
  language: string;
  host: string;
  protocol: string;
  headers?: {
    "cf-ray"?: string;
    "cf-ipcountry"?: string;
    "x-vercel-id"?: string;
    "x-vercel-ip-country"?: string;
    "x-vercel-ip-city"?: string;
  };
}

export function PublicIpCard() {
  const [data, setData] = useState<IpResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchIpDetails() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ip", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "IP sorgulanamadı");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchIpDetails();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Globe className="w-4 h-4 text-radar-teal" />
          Genel WAN Çıkışı ve Kenar Rotası
        </CardTitle>
        <button
          onClick={fetchIpDetails}
          disabled={isLoading}
          className="p-1 rounded text-slate-400 hover:text-radar-teal transition-colors"
          title="IP ayrıntılarını yenile"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-radar-teal border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-radar-muted">Genel IP adresi tespit ediliyor...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            Genel IP denetlenirken hata oluştu: {error}
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className="bg-radar-bg p-4 rounded-lg border border-radar-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">
                  Genel İstemci IP Adresi
                </span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  {data.ip}
                </span>
              </div>
              <Badge variant="teal">{data.version}</Badge>
            </div>

            <div className="bg-radar-bg p-3 rounded-lg border border-radar-border space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-radar-subtle">Giriş Protokolü:</span>
                <span className="text-slate-200 uppercase">{data.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-radar-subtle">Sunucu Ana Bilgisayarı:</span>
                <span className="text-slate-200">{data.host || "Localhost"}</span>
              </div>
              {data.headers?.["cf-ipcountry"] && (
                <div className="flex justify-between">
                  <span className="text-radar-subtle">Cloudflare Ülke:</span>
                  <span className="text-slate-200">{data.headers["cf-ipcountry"]}</span>
                </div>
              )}
              {data.headers?.["x-vercel-ip-country"] && (
                <div className="flex justify-between">
                  <span className="text-radar-subtle">Vercel Bölge Ülkesi:</span>
                  <span className="text-slate-200">{data.headers["x-vercel-ip-country"]}</span>
                </div>
              )}
              {data.headers?.["x-vercel-id"] && (
                <div className="flex justify-between">
                  <span className="text-radar-subtle">Kenar Çağrı Kimliği:</span>
                  <span className="text-slate-200 truncate max-w-[200px]">{data.headers["x-vercel-id"]}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
