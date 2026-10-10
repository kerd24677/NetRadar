"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { measureHttpLatency } from "@/lib/diagnostics/httpPing";
import { saveHistoryItem } from "@/lib/storage/historyStore";
import { HttpDiagnosticResult } from "@/types/diagnostics";
import { formatDuration } from "@/lib/utils/formatters";
import { ContinuousPingMonitor } from "./ContinuousPingMonitor";
import { MultiCdnBenchmarkCard } from "./MultiCdnBenchmarkCard";
import { HttpInspectCard } from "./HttpInspectCard";
import { Globe, AlertTriangle, Clock, RefreshCw, Zap } from "lucide-react";

export function HttpDiagnosticsView() {
  const [urlInput, setUrlInput] = useState<string>("https://cloudflare.com");
  const [timeoutMs, setTimeoutMs] = useState<number>(5000);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<HttpDiagnosticResult | null>(null);
  const [subMode, setSubMode] = useState<"probe" | "continuous" | "headers">("probe");

  async function handleExecuteTest() {
    if (!urlInput.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await measureHttpLatency(urlInput.trim(), { timeoutMs });
      setResult(res);

      await saveHistoryItem({
        id: `http_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        category: "http",
        target: res.normalizedUrl || urlInput.trim(),
        startTime: res.timingDetails?.startTime ? Date.now() - Math.round(res.durationMs) : Date.now(),
        endTime: Date.now(),
        durationMs: res.durationMs,
        status: res.status === "success" ? "success" : res.status === "opaque" ? "warning" : "error",
        summary: `HTTP gecikmesi ${formatDuration(res.durationMs)} (${res.statusText || res.status})`,
        details: { http: res },
        errorMessage: res.errorMessage,
      });
    } catch (err) {
      console.error("HTTP test hatası:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Primary Probe Engine Card */}
      <Card glow={isLoading}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-radar-teal" />
            <CardTitle>HTTP / HTTPS Yanıt Gecikmesi & Erişilebilirlik</CardTitle>
          </div>
          <div className="flex items-center gap-1.5 bg-radar-bg p-1 rounded-lg border border-radar-border">
            <button
              onClick={() => setSubMode("probe")}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                subMode === "probe"
                  ? "bg-radar-surface text-radar-teal font-semibold shadow"
                  : "text-radar-muted hover:text-slate-200"
              }`}
            >
              Tekil Sonda
            </button>
            <button
              onClick={() => setSubMode("continuous")}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                subMode === "continuous"
                  ? "bg-radar-surface text-radar-teal font-semibold shadow"
                  : "text-radar-muted hover:text-slate-200"
              }`}
            >
              Sürekli Akış
            </button>
            <button
              onClick={() => setSubMode("headers")}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                subMode === "headers"
                  ? "bg-radar-surface text-radar-teal font-semibold shadow"
                  : "text-radar-muted hover:text-slate-200"
              }`}
            >
              Güvenlik Başlıkları
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Input & Immediate Action Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 relative">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://ornek.com veya alan adı"
                className="w-full bg-radar-bg border border-radar-border rounded-lg pl-3 pr-20 py-2.5 text-sm font-mono text-slate-100 placeholder:text-radar-subtle focus:outline-none focus:ring-1 focus:ring-radar-teal"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <select
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(Number(e.target.value))}
                  className="bg-radar-surface text-xs font-mono text-radar-muted rounded px-1.5 py-1 border border-radar-border focus:outline-none"
                >
                  <option value={2000}>2 sn</option>
                  <option value={5000}>5 sn</option>
                  <option value={10000}>10 sn</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleExecuteTest}
              isLoading={isLoading}
              disabled={!urlInput.trim()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="shrink-0 font-mono tracking-wide"
            >
              Sondayı Çalıştır
            </Button>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-radar-subtle font-mono">Hızlı Hedefler:</span>
            {[
              "https://1.1.1.1",
              "https://cloudflare.com",
              "https://dns.google",
              "https://github.com",
              "https://aws.amazon.com",
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => setUrlInput(preset)}
                className={`font-mono px-2 py-0.5 rounded border transition-colors ${
                  urlInput === preset
                    ? "bg-radar-elevated text-radar-teal border-radar-teal/40"
                    : "bg-radar-bg hover:bg-radar-elevated text-slate-300 border-radar-border"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Technical Disclosure Box */}
          <div className="p-3 rounded-lg bg-radar-elevated/40 border border-radar-border text-xs text-radar-muted flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-radar-teal shrink-0 mt-0.5" />
            <p>
              <code className="text-radar-teal font-mono">performance.now()</code> üzerinden mikrosaniye hassasiyetiyle gerçek uygulama katmanı HTTP/HTTPS gidiş-dönüş süresini ölçer. İstemci TCP el sıkışmasını, TLS anlaşmasını ve ilk bayt yanıtını yansıtır. Tarayıcı güvenlik kum havuzu doğrudan ham ICMP isteklerine izin vermez.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Result Display for Single Probe */}
      {subMode === "probe" && result && (
        <Card glow={result.status === "success"}>
          <CardHeader>
            <CardTitle>
              <Clock className="w-4 h-4 text-radar-teal" />
              Ölçüm Raporu: <span className="font-mono text-white">{result.normalizedUrl}</span>
            </CardTitle>
            <Badge
              variant={
                result.status === "success"
                  ? "emerald"
                  : result.status === "opaque"
                  ? "amber"
                  : "rose"
              }
            >
              {result.status === "success"
                ? "BAŞARILI"
                : result.status === "opaque"
                ? "OPAQUE (KAPALI)"
                : "HATA"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Gidiş-Dönüş Süresi</span>
                <span className="text-xl font-bold font-mono text-radar-teal mt-0.5 block">
                  {formatDuration(result.durationMs)}
                </span>
                <span className="text-[10px] text-radar-muted">performance.now()</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">HTTP Durumu</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {result.httpStatus !== undefined && result.httpStatus > 0
                    ? result.httpStatus
                    : result.isOpaqueResponse
                    ? "0 (Opaque)"
                    : "Yok"}
                </span>
                <span className="text-[10px] text-radar-muted truncate block">
                  {result.statusText || "Yanıt Kodu"}
                </span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Protokol</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block uppercase">
                  {result.protocol ? result.protocol.replace(":", "") : "HTTPS"}
                </span>
                <span className="text-[10px] text-radar-muted">Şema</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">CORS Yalıtımı</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block">
                  {result.isOpaqueResponse ? "Opaque (Yalıtılmış)" : "Standart"}
                </span>
                <span className="text-[10px] text-radar-muted">Tarayıcı Kuralı</span>
              </div>
            </div>

            {result.isOpaqueResponse && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Kökenler Arası Kaynak Paylaşımı (CORS) Bildirimi:</strong> Uzak ana bilgisayar başarıyla yanıt verdi ancak tarayıcıya kökenler arası başlık okuma izni verilmedi. Tarayıcı başlık içeriğini yalıtır ancak {formatDuration(result.durationMs)} gidiş-dönüş ağ süresi tamamen gerçek ve doğrulanmıştır.
                </p>
              </div>
            )}

            {result.errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Tanılama Detayı:</strong> {result.errorMessage}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submode views */}
      {subMode === "continuous" && (
        <ContinuousPingMonitor targetUrl={urlInput} />
      )}

      {subMode === "headers" && (
        <HttpInspectCard initialUrl={urlInput} />
      )}

      {/* Global Anycast / CDN Benchmark Leaderboard */}
      <MultiCdnBenchmarkCard />
    </div>
  );
}
