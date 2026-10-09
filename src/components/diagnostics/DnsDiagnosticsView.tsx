"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { queryDnsOverHttps } from "@/lib/diagnostics/dnsOverHttps";
import { saveHistoryItem } from "@/lib/storage/historyStore";
import { DnsQueryResult, DnsRecordType } from "@/types/dns";
import { DOH_RESOLVERS } from "@/types/settings";
import { formatDuration } from "@/lib/utils/formatters";
import { Server, RefreshCw, AlertTriangle, Database } from "lucide-react";

const RECORD_TYPES: DnsRecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "TXT",
  "SOA",
  "PTR",
  "SRV",
];

export function DnsDiagnosticsView() {
  const [domainInput, setDomainInput] = useState<string>("google.com");
  const [recordType, setRecordType] = useState<DnsRecordType>("A");
  const [resolverUrl, setResolverUrl] = useState<string>(DOH_RESOLVERS[0].url);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DnsQueryResult | null>(null);

  async function handleQuery() {
    if (!domainInput.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await queryDnsOverHttps(domainInput.trim(), recordType, {
        resolverUrl,
        timeoutMs: 6000,
      });

      setResult(res);

      await saveHistoryItem({
        id: `dns_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        category: "dns",
        target: `${res.domain} (${res.recordType})`,
        startTime: res.timestamp - Math.round(res.durationMs),
        endTime: res.timestamp,
        durationMs: res.durationMs,
        status: res.status === "success" ? "success" : "error",
        summary: `DNS ${res.recordType} query: ${res.answers.length} record(s) via ${res.statusText}`,
        details: { dns: res },
        errorMessage: res.errorMessage,
      });
    } catch (err) {
      console.error("DNS query error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Server className="w-4 h-4 text-radar-teal" />
            DNS-over-HTTPS (DoH) Resolver
          </CardTitle>
          <Badge variant="cyan">RFC 8427 / DNS-JSON</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-lg bg-radar-elevated/40 border border-radar-border text-xs text-radar-muted space-y-1">
            <p className="text-slate-200 font-medium">DNS Architecture Clarification:</p>
            <p>
              Web browsers cannot open raw UDP sockets on port 53. NetRadar performs genuine recursive queries using standard DNS-over-HTTPS (DoH) endpoints.
            </p>
            <p className="text-radar-subtle text-[11px] pt-1">
              DoH latency measures HTTPS transport round-trip to the chosen resolver plus resolver cache/authoritative lookup time, not raw UDP 53 latency.
            </p>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5 space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">Domain / Hostname</label>
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="e.g. example.com"
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder:text-radar-subtle focus:outline-none focus:ring-1 focus:ring-radar-teal"
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">Record Type</label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as DnsRecordType)}
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-teal"
              >
                {RECORD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">DoH Resolver</label>
              <select
                value={resolverUrl}
                onChange={(e) => setResolverUrl(e.target.value)}
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-teal"
              >
                {DOH_RESOLVERS.map((res) => (
                  <option key={res.url} value={res.url}>
                    {res.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preset domains */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-radar-subtle font-mono">Popular:</span>
            {["google.com", "cloudflare.com", "github.com", "apple.com", "microsoft.com"].map(
              (preset) => (
                <button
                  key={preset}
                  onClick={() => setDomainInput(preset)}
                  className="text-xs font-mono px-2 py-1 rounded bg-radar-bg hover:bg-radar-elevated border border-radar-border text-slate-300 hover:text-radar-teal transition-colors"
                >
                  {preset}
                </button>
              )
            )}
          </div>

          <div className="pt-2">
            <Button
              onClick={handleQuery}
              isLoading={isLoading}
              disabled={!domainInput.trim()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Resolve DNS Records
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result Display */}
      {result && (
        <Card glow={result.status === "success"}>
          <CardHeader>
            <CardTitle>
              <Database className="w-4 h-4 text-radar-teal" />
              DoH Query Results for <span className="font-mono text-white">{result.domain}</span> ({result.recordType})
            </CardTitle>
            <Badge variant={result.status === "success" ? "emerald" : "rose"}>
              {result.statusText}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Round-Trip Time</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {formatDuration(result.durationMs)}
                </span>
                <span className="text-[10px] text-radar-muted">DoH HTTP Round-trip</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Records Found</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {result.answers.length}
                </span>
                <span className="text-[10px] text-radar-muted">{result.recordType} Records</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">DNSSEC Validated</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {result.dnssecValidated ? "Yes (AD flag)" : "No"}
                </span>
                <span className="text-[10px] text-radar-muted">Authentic Data</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Status Code</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block">
                  RCODE {result.statusCode}
                </span>
                <span className="text-[10px] text-radar-muted truncate block">{result.statusText}</span>
              </div>
            </div>

            {/* Answers Table */}
            {result.answers.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-radar-border">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-radar-elevated text-radar-subtle border-b border-radar-border">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">TTL</th>
                      <th className="p-2.5">Record Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-radar-border bg-radar-bg">
                    {result.answers.map((ans, idx) => (
                      <tr key={idx} className="hover:bg-radar-elevated/40">
                        <td className="p-2.5 text-slate-300">{ans.name}</td>
                        <td className="p-2.5">
                          <Badge variant="outline">{ans.typeName || ans.type}</Badge>
                        </td>
                        <td className="p-2.5 text-radar-muted">{ans.TTL}s</td>
                        <td className="p-2.5 text-radar-teal font-semibold break-all">{ans.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-radar-bg border border-radar-border text-center text-xs text-radar-muted">
                {result.status === "success"
                  ? `No ${result.recordType} records exist for ${result.domain}. Resolver returned 0 answers.`
                  : result.errorMessage || "DNS query failed."}
              </div>
            )}

            {result.errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Query Notice:</strong> {result.errorMessage}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
