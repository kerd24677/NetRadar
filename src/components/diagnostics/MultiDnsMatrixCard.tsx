"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { queryDnsOverHttps } from "@/lib/diagnostics/dnsOverHttps";
import { DOH_RESOLVERS } from "@/types/settings";
import { DnsQueryResult, DnsRecordType } from "@/types/dns";
import { formatDuration } from "@/lib/utils/formatters";
import { Server, Trophy, RefreshCw, Database } from "lucide-react";

interface MultiDnsMatrixCardProps {
  initialDomain?: string;
}

export function MultiDnsMatrixCard({ initialDomain = "google.com" }: MultiDnsMatrixCardProps) {
  const [domain, setDomain] = useState<string>(initialDomain);
  const [recordType, setRecordType] = useState<DnsRecordType>("A");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<DnsQueryResult[]>([]);
  const [fastestResolver, setFastestResolver] = useState<string | null>(null);

  async function handleCompare() {
    if (!domain.trim() || isLoading) return;

    setIsLoading(true);
    setResults([]);
    setFastestResolver(null);

    const promises = DOH_RESOLVERS.map((resolver) =>
      queryDnsOverHttps(domain.trim(), recordType, {
        resolverUrl: resolver.url,
        timeoutMs: 5000,
      })
    );

    const resolved = await Promise.all(promises);
    setResults(resolved);

    // Determine fastest
    let minTime = Infinity;
    let winner = "";
    resolved.forEach((r) => {
      if (r.status === "success" && r.durationMs > 0 && r.durationMs < minTime) {
        minTime = r.durationMs;
        winner = r.resolver;
      }
    });

    if (winner) setFastestResolver(winner);
    setIsLoading(false);
  }

  return (
    <Card className="mt-4 border-radar-cyan/20">
      <CardHeader>
        <CardTitle>
          <Database className="w-4 h-4 text-radar-cyan" />
          Çoklu Çözümleyici DoH Kıyaslama Matrisi
        </CardTitle>
        <span className="text-xs font-mono text-radar-subtle">Yan Yana Karşılaştırma</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-radar-muted">
          Önde gelen özyinelemeli çözümleyiciler arasında DNS çözümleme performansını, yanıt tutarlılığını ve DNSSEC doğrulamasını eşzamanlı olarak karşılaştırın:
        </p>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Karşılaştırılacak alan adı (örn: apple.com)"
            className="flex-1 bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-radar-subtle focus:outline-none focus:ring-1 focus:ring-radar-cyan"
          />
          <select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value as DnsRecordType)}
            className="bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-cyan"
          >
            <option value="A">A (IPv4)</option>
            <option value="AAAA">AAAA (IPv6)</option>
            <option value="CNAME">CNAME</option>
            <option value="MX">MX</option>
            <option value="TXT">TXT</option>
          </select>
          <Button
            size="sm"
            onClick={handleCompare}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Tüm Çözümleyicileri Karşılaştır
          </Button>
        </div>

        {/* Results Matrix Grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {results.map((res) => {
              const matchedResolver = DOH_RESOLVERS.find((r) => r.url === res.resolver);
              const name = matchedResolver?.name || res.resolver;
              const isWinner = res.resolver === fastestResolver;

              return (
                <div
                  key={res.resolver}
                  className={`p-3.5 rounded-lg border space-y-2 transition-all ${
                    isWinner
                      ? "bg-radar-elevated border-radar-teal/60 shadow-noc-glow"
                      : "bg-radar-bg border-radar-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-100 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-radar-cyan" />
                      {name}
                    </span>
                    {isWinner && (
                      <Badge variant="emerald" className="gap-1 text-[10px]">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        EN HIZLI
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-[11px] font-mono text-radar-subtle uppercase">Yanıt Süresi</span>
                    <span
                      className={`text-base font-bold font-mono ${
                        isWinner ? "text-radar-teal" : "text-slate-200"
                      }`}
                    >
                      {formatDuration(res.durationMs)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-radar-subtle">DNSSEC (AD)</span>
                    <Badge variant={res.dnssecValidated ? "emerald" : "outline"} className="text-[9px]">
                      {res.dnssecValidated ? "Doğrulandı" : "Yok"}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-radar-border/40">
                    <span className="text-[10px] font-mono text-radar-subtle uppercase block mb-1">
                      Kayıtlar ({res.answers.length})
                    </span>
                    <div className="bg-radar-surface/80 p-2 rounded text-[11px] font-mono text-radar-teal max-h-24 overflow-y-auto space-y-0.5">
                      {res.answers.length > 0 ? (
                        res.answers.map((ans, idx) => (
                          <div key={idx} className="truncate">
                            {ans.data}
                          </div>
                        ))
                      ) : (
                        <span className="text-radar-muted">Kayıt yok / NXDOMAIN</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
