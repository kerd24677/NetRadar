"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { measureHttpLatency } from "@/lib/diagnostics/httpPing";
import { queryDnsOverHttps } from "@/lib/diagnostics/dnsOverHttps";
import { saveHistoryItem } from "@/lib/storage/historyStore";
import { HttpDiagnosticResult } from "@/types/diagnostics";
import { DnsQueryResult } from "@/types/dns";
import { formatDuration } from "@/lib/utils/formatters";
import { Zap, Globe, Server, ArrowRight } from "lucide-react";
import Link from "next/link";

interface QuickDiagnosticsCardProps {
  onTestComplete?: () => void;
}

export function QuickDiagnosticsCard({ onTestComplete }: QuickDiagnosticsCardProps) {
  const [target, setTarget] = useState<string>("cloudflare.com");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [httpResult, setHttpResult] = useState<HttpDiagnosticResult | null>(null);
  const [dnsResult, setDnsResult] = useState<DnsQueryResult | null>(null);
  const [lastTestedTarget, setLastTestedTarget] = useState<string>("");

  async function handleRunProbe() {
    if (!target.trim() || isRunning) return;

    setIsRunning(true);
    setHttpResult(null);
    setDnsResult(null);
    setLastTestedTarget(target.trim());

    try {
      // 1. Run real HTTP latency probe
      const http = await measureHttpLatency(target.trim(), { timeoutMs: 6000 });
      setHttpResult(http);

      // Save HTTP test to IndexedDB
      await saveHistoryItem({
        id: `http_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        category: "http",
        target: http.normalizedUrl || target.trim(),
        startTime: Date.now() - Math.round(http.durationMs),
        endTime: Date.now(),
        durationMs: http.durationMs,
        status: http.status === "error" ? "error" : http.status === "opaque" ? "warning" : "success",
        summary: `HTTP gecikmesi ${formatDuration(http.durationMs)} (${http.statusText || http.status})`,
        details: { http },
        errorMessage: http.errorMessage,
      });

      // 2. Run real DNS DoH query
      const cleanHost = target.trim().replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
      const dns = await queryDnsOverHttps(cleanHost, "A", { timeoutMs: 6000 });
      setDnsResult(dns);

      // Save DNS test to IndexedDB
      await saveHistoryItem({
        id: `dns_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        category: "dns",
        target: `${dns.domain} (A)`,
        startTime: dns.timestamp - Math.round(dns.durationMs),
        endTime: dns.timestamp,
        durationMs: dns.durationMs,
        status: dns.status === "success" ? "success" : "error",
        summary: `DNS A sorgusu: ${dns.answers.length} kayıt, ${formatDuration(dns.durationMs)}`,
        details: { dns },
        errorMessage: dns.errorMessage,
      });

      onTestComplete?.();
    } catch (err) {
      console.error("Hızlı tanılama hatası:", err);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Card className="h-full" glow={isRunning}>
      <CardHeader>
        <CardTitle>
          <Zap className="w-4 h-4 text-radar-teal" />
          Hızlı Tanılama Sınaması
        </CardTitle>
        <span className="text-xs font-mono text-radar-muted">Doğrulanmış Uçtan Uca</span>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input & Action */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-radar-subtle block">
            Hedef Sunucu (Ana Bilgisayar veya URL)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="örn. / e.g. cloudflare.com, 1.1.1.1, github.com"
              className="flex-1 bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-sm text-slate-100 font-mono placeholder:text-radar-subtle focus:outline-none focus:ring-1 focus:ring-radar-teal"
              disabled={isRunning}
            />
            <Button
              onClick={handleRunProbe}
              isLoading={isRunning}
              disabled={!target.trim()}
              className="shrink-0 font-mono shadow-noc-glow"
            >
              Sına (Probe)
            </Button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-radar-subtle">
            <span>Hızlı hedefler:</span>
            {["cloudflare.com", "dns.google", "github.com"].map((preset) => (
              <button
                key={preset}
                onClick={() => setTarget(preset)}
                className="text-radar-teal hover:underline font-mono"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Results Display */}
        {isRunning && (
          <div className="p-4 rounded-lg bg-radar-bg border border-radar-border flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-radar-teal border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-mono text-radar-teal">
              HTTP gidiş-dönüş ve DNS çözümlemesi ölçülüyor...
            </span>
          </div>
        )}

        {!isRunning && (httpResult || dnsResult) && (
          <div className="space-y-3 pt-2 border-t border-radar-border">
            <div className="flex items-center justify-between text-xs text-radar-muted">
              <span>Hedef: <strong className="text-slate-200 font-mono">{lastTestedTarget}</strong></span>
              <Badge variant="teal">Canlı Ölçüldü (Measured Live)</Badge>
            </div>

            {/* HTTP Result */}
            {httpResult && (
              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-radar-teal" />
                    <span className="text-xs font-semibold text-slate-200">HTTP Yanıt Süresi (HTTP Response Time)</span>
                  </div>
                  <Badge
                    variant={
                      httpResult.status === "success"
                        ? "emerald"
                        : httpResult.status === "opaque"
                        ? "amber"
                        : "rose"
                    }
                  >
                    {formatDuration(httpResult.durationMs)}
                  </Badge>
                </div>
                <div className="text-xs text-radar-muted flex items-center justify-between">
                  <span>Durum: <span className="font-mono text-slate-300">{httpResult.statusText || httpResult.httpStatus || "N/A"}</span></span>
                  <span className="text-[11px] text-radar-subtle font-mono">{httpResult.protocol}</span>
                </div>
                {httpResult.errorMessage && (
                  <p className="text-[11px] text-red-300 border-t border-radar-border/40 pt-1 mt-1">
                    {httpResult.errorMessage}
                  </p>
                )}
              </div>
            )}

            {/* DNS Result */}
            {dnsResult && (
              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-radar-cyan" />
                    <span className="text-xs font-semibold text-slate-200">DNS Çözümleme (DNS Resolution DoH)</span>
                  </div>
                  <Badge variant={dnsResult.status === "success" ? "emerald" : "rose"}>
                    {formatDuration(dnsResult.durationMs)}
                  </Badge>
                </div>
                <div className="text-xs text-radar-muted">
                  <span>Kayıtlar ({dnsResult.answers.length}): </span>
                  <span className="font-mono text-slate-200">
                    {dnsResult.answers.length > 0
                      ? dnsResult.answers.map((a) => a.data).join(", ")
                      : "Kayıt dönmedi"}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-1 flex justify-end">
              <Link
                href="/diagnostics"
                className="text-xs text-radar-teal hover:underline flex items-center gap-1 font-mono"
              >
                Gelişmiş Tanılama Paketini Aç <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {!isRunning && !httpResult && !dnsResult && (
          <div className="p-4 rounded-lg bg-radar-bg/40 border border-radar-border/60 text-center text-xs text-radar-muted">
            Yukarıya bir alan adı veya IP yazarak Sına butonuna dokunun; gerçek HTTP ve DoH DNS tanılaması başlatılacaktır.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
