"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ConnectionStatusCard } from "@/components/dashboard/ConnectionStatusCard";
import { QuickDiagnosticsCard } from "@/components/dashboard/QuickDiagnosticsCard";
import { LatencyChartCard } from "@/components/dashboard/LatencyChartCard";
import { RecentHistoryCard } from "@/components/dashboard/RecentHistoryCard";
import { MultiCdnBenchmarkCard } from "@/components/diagnostics/MultiCdnBenchmarkCard";
import { getAllHistory, saveHistoryItem } from "@/lib/storage/historyStore";
import { measureHttpLatency } from "@/lib/diagnostics/httpPing";
import { queryDnsOverHttps } from "@/lib/diagnostics/dnsOverHttps";
import { HistoryItem } from "@/types/history";
import {
  ShieldCheck,
  HardDrive,
  Radio,
  Layers,
  Activity,
  Sparkles,
  TrendingUp,
  MapPin,
  ArrowRight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function OverviewPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [successRate, setSuccessRate] = useState<number>(100);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const items = await getAllHistory({ sortBy: "newest" });
      setHistoryItems(items);
      setTotalCount(items.length);

      if (items.length > 0) {
        const successes = items.filter((i) => i.status === "success").length;
        setSuccessRate(Math.round((successes / items.length) * 100));
      }
    } catch (err) {
      console.warn("Geçmiş yüklenirken hata:", err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Execute a full sequential NOC audit across HTTP and DNS
  async function handleRunFullAudit() {
    setIsAuditing(true);
    setAuditMessage("Kapsamlı çok katmanlı NOC denetimi başlatılıyor...");

    try {
      // 1. HTTP Probe to 1.1.1.1
      setAuditMessage("Anycast HTTP Ağ Geçidi gecikmesi ölçülüyor...");
      const httpRes = await measureHttpLatency("https://1.1.1.1", { timeoutMs: 4000 });
      await saveHistoryItem({
        id: `audit_http_${Date.now()}`,
        category: "http",
        target: "https://1.1.1.1",
        startTime: Date.now() - Math.round(httpRes.durationMs),
        endTime: Date.now(),
        durationMs: httpRes.durationMs,
        status: httpRes.status === "error" ? "error" : "success",
        summary: `Denetim: Anycast HTTP ${httpRes.durationMs}ms`,
        details: { http: httpRes },
      });

      // 2. DNS DoH Query to Cloudflare
      setAuditMessage("DNS-over-HTTPS kök bölgesi sorgulanıyor...");
      const dnsRes = await queryDnsOverHttps("cloudflare.com", "A", { timeoutMs: 4000 });
      await saveHistoryItem({
        id: `audit_dns_${Date.now()}`,
        category: "dns",
        target: "cloudflare.com (A)",
        startTime: dnsRes.timestamp - Math.round(dnsRes.durationMs),
        endTime: dnsRes.timestamp,
        durationMs: dnsRes.durationMs,
        status: dnsRes.status,
        summary: `Denetim: DNS A kaydı ${dnsRes.durationMs}ms sürede çözüldü`,
        details: { dns: dnsRes },
      });

      setAuditMessage("NOC denetimi başarıyla tamamlandı. Tüm telemetri dizine eklendi.");
      await loadHistory();
      setTimeout(() => setAuditMessage(null), 4000);
    } catch (err) {
      console.warn("Denetim hatası:", err);
      setAuditMessage("Denetim uyarılarla tamamlandı.");
    } finally {
      setIsAuditing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Header & Top Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-radar-teal animate-pulse-teal" />
            Ağ Operasyon Merkezi (NOC) Konsolu
          </h1>
          <p className="text-xs sm:text-sm text-radar-muted mt-1">
            Gerçek zamanlı telemetri, şifreli DoH çözümleyicileri ve istemci tanılama paneli.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRunFullAudit}
            isLoading={isAuditing}
            size="sm"
            className="shadow-noc-glow text-xs font-mono"
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Tam NOC Denetimi Çalıştır
          </Button>
        </div>
      </div>

      {auditMessage && (
        <div className="p-3 rounded-lg bg-radar-elevated border border-radar-teal/40 text-xs font-mono text-radar-teal flex items-center gap-2 animate-fade-in shadow-noc-glow">
          <Activity className="w-4 h-4 animate-spin" />
          <span>{auditMessage}</span>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3.5 sm:p-4 bg-radar-surface/90 border border-radar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-radar-elevated border border-radar-teal/30 flex items-center justify-center text-radar-teal shadow-noc-glow">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-radar-subtle block">
                Toplam Test
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-white">
                {totalCount}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-radar-surface/90 border border-radar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-radar-elevated border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-radar-subtle block">
                Başarı Oranı
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                {totalCount > 0 ? `${successRate}%` : "%100"}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-radar-surface/90 border border-radar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-radar-elevated border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-radar-subtle block">
                Yerel Kasa
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-cyan-400">
                IndexedDB
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-radar-surface/90 border border-radar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-radar-elevated border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-radar-subtle block">
                Çözümleyici
              </span>
              <span className="text-sm font-semibold font-mono text-white truncate max-w-[120px]">
                DoH Aktif
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Feature Showcase Grid: Topology, Stability & Field Map */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Topology Card */}
        <Link
          href="/topology"
          className="group p-4 rounded-xl bg-radar-surface/90 border border-radar-border hover:border-radar-cyan/60 transition-all shadow-md flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-radar-cyan/10 border border-radar-cyan/30 flex items-center justify-center text-radar-cyan group-hover:scale-105 transition-transform shadow-noc-glow-cyan">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100 group-hover:text-radar-cyan transition-colors flex items-center gap-1.5">
                Ağ Topolojisi Haritası
                <span className="text-[10px] bg-radar-cyan/20 text-radar-cyan px-1.5 py-0.2 rounded font-mono font-bold">
                  CANLI
                </span>
              </div>
              <div className="text-xs text-radar-subtle mt-0.5">
                Uçtan uca yönlendirme, canlı düğüm sına ve hareketli veri akışı
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-radar-subtle group-hover:text-radar-cyan group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </Link>

        {/* Stability Card */}
        <Link
          href="/stability"
          className="group p-4 rounded-xl bg-radar-surface/90 border border-radar-border hover:border-radar-teal/60 transition-all shadow-md flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-radar-teal/10 border border-radar-teal/30 flex items-center justify-center text-radar-teal group-hover:scale-105 transition-transform shadow-noc-glow">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100 group-hover:text-radar-teal transition-colors flex items-center gap-1.5">
                Kararlılık Analitiği
                <span className="text-[10px] bg-radar-teal/20 text-radar-teal px-1.5 py-0.2 rounded font-mono font-bold">
                  YENİ
                </span>
              </div>
              <div className="text-xs text-radar-subtle mt-0.5">
                RFC 3550 seğirme, P95 gecikme ve kesinti toparlanma süresi
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-radar-subtle group-hover:text-radar-teal group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </Link>

        {/* Field Map Card */}
        <Link
          href="/map"
          className="group p-4 rounded-xl bg-radar-surface/90 border border-radar-border hover:border-radar-blue/60 transition-all shadow-md flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-radar-blue/10 border border-radar-blue/30 flex items-center justify-center text-radar-blue group-hover:scale-105 transition-transform shadow-noc-glow">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100 group-hover:text-radar-blue transition-colors flex items-center gap-1.5">
                Saha Haritası &amp; 3D Görünüm
                <span className="text-[10px] bg-radar-blue/20 text-radar-blue px-1.5 py-0.2 rounded font-mono font-bold">
                  YENİ
                </span>
              </div>
              <div className="text-xs text-radar-subtle mt-0.5">
                GPS izi, sinyal yoğunluk haritası, izometrik 3D ve kuleler
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-radar-subtle group-hover:text-radar-blue group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </Link>
      </div>

      {/* Main Grid: Telemetry Status + Quick Probe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConnectionStatusCard />
        <QuickDiagnosticsCard onTestComplete={loadHistory} />
      </div>

      {/* Multi-CDN Anycast Latency Matrix */}
      <MultiCdnBenchmarkCard />

      {/* Secondary Grid: Latency Chart + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatencyChartCard historyItems={historyItems} />
        <RecentHistoryCard items={historyItems} />
      </div>
    </div>
  );
}
