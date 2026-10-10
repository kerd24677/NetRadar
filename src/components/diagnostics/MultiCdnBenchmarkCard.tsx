"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { measureHttpLatency } from "@/lib/diagnostics/httpPing";
import { formatDuration } from "@/lib/utils/formatters";
import { RefreshCw, Zap, Trophy } from "lucide-react";

interface CdnTarget {
  name: string;
  provider: string;
  url: string;
  badge: string;
}

const CDN_TARGETS: CdnTarget[] = [
  { name: "Cloudflare 1.1.1.1", provider: "Cloudflare Anycast", url: "https://1.1.1.1", badge: "Anycast" },
  { name: "Google Public DNS", provider: "Google Edge", url: "https://dns.google", badge: "Global" },
  { name: "Quad9 DNS", provider: "Quad9 Anycast", url: "https://dns.quad9.net", badge: "Anycast" },
  { name: "GitHub Infrastructure", provider: "Microsoft / Fastly", url: "https://github.com", badge: "CDN" },
  { name: "AWS CloudFront", provider: "Amazon Web Services", url: "https://aws.amazon.com", badge: "Edge" },
];

interface CdnResult {
  target: CdnTarget;
  durationMs: number;
  status: "success" | "error" | "opaque";
  isLoading: boolean;
}

export function MultiCdnBenchmarkCard() {
  const [results, setResults] = useState<CdnResult[]>(
    CDN_TARGETS.map((t) => ({ target: t, durationMs: 0, status: "opaque", isLoading: false }))
  );
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [fastestName, setFastestName] = useState<string | null>(null);

  async function runBenchmark() {
    setIsBenchmarking(true);
    setFastestName(null);

    // Set all to loading
    setResults(CDN_TARGETS.map((t) => ({ target: t, durationMs: 0, status: "opaque", isLoading: true })));

    const promises = CDN_TARGETS.map(async (target, idx) => {
      try {
        const res = await measureHttpLatency(target.url, { timeoutMs: 4000 });
        return {
          idx,
          result: {
            target,
            durationMs: res.durationMs,
            status: res.status,
            isLoading: false,
          },
        };
      } catch {
        return {
          idx,
          result: {
            target,
            durationMs: 9999,
            status: "error" as const,
            isLoading: false,
          },
        };
      }
    });

    const finished = await Promise.all(promises);
    const updated = [...results];
    let minDuration = Infinity;
    let winner = "";

    finished.forEach(({ idx, result }) => {
      updated[idx] = result;
      if (result.status !== "error" && result.durationMs > 0 && result.durationMs < minDuration) {
        minDuration = result.durationMs;
        winner = result.target.name;
      }
    });

    setResults(updated);
    if (winner) setFastestName(winner);
    setIsBenchmarking(false);
  }

  // Auto-run once on mount so NOC dashboard immediately displays live telemetry!
  useEffect(() => {
    runBenchmark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Zap className="w-4 h-4 text-radar-teal" />
          Küresel Anycast & CDN Gecikme Matrisi
        </CardTitle>
        <div className="flex items-center gap-2">
          {fastestName && (
            <Badge variant="emerald" className="hidden sm:inline-flex gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              En Hızlı: {fastestName}
            </Badge>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={runBenchmark}
            isLoading={isBenchmarking}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Tümünü Sına
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-radar-muted">
          Mevcut tarayıcı ortamınızdan önde gelen küresel anycast uç noktalarına eşzamanlı gerçek zamanlı HTTP gidiş-dönüş ölçümleri:
        </p>

        <div className="space-y-2.5 pt-1">
          {results.map((item) => {
            const isWinner = item.target.name === fastestName;
            // Max bar reference 250ms
            const percent = Math.min(100, Math.max(8, (item.durationMs / 200) * 100));

            return (
              <div
                key={item.target.url}
                className={`p-2.5 sm:p-3 rounded-lg border transition-all ${
                  isWinner
                    ? "bg-radar-elevated border-radar-teal/50 shadow-noc-glow"
                    : "bg-radar-bg border-radar-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold font-mono text-slate-100 truncate">
                      {item.target.name}
                    </span>
                    <span className="text-[10px] text-radar-subtle hidden sm:inline">
                      ({item.target.provider})
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 hidden md:inline-flex">
                      {item.target.badge}
                    </Badge>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 font-mono">
                    {item.isLoading ? (
                      <span className="text-xs text-radar-teal animate-pulse">Sınanıyor...</span>
                    ) : item.durationMs > 0 ? (
                      <>
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isWinner ? "text-radar-teal" : "text-slate-200"
                          }`}
                        >
                          {formatDuration(item.durationMs)}
                        </span>
                        {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-400 inline" />}
                      </>
                    ) : (
                      <span className="text-xs text-radar-muted">Beklemede</span>
                    )}
                  </div>
                </div>

                {/* Latency Bar */}
                <div className="w-full bg-radar-surface h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      item.isLoading
                        ? "bg-slate-700 animate-pulse w-1/3"
                        : isWinner
                        ? "bg-radar-teal shadow-[0_0_8px_rgba(77,224,193,0.8)]"
                        : item.durationMs < 60
                        ? "bg-emerald-400"
                        : item.durationMs < 150
                        ? "bg-cyan-400"
                        : "bg-amber-400"
                    }`}
                    style={{ width: item.isLoading ? "30%" : `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
