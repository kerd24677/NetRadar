"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Shield, RefreshCw } from "lucide-react";

interface InspectData {
  url: string;
  hostname: string;
  status: number;
  statusText: string;
  durationMs: number;
  httpVersion: string;
  headers: Record<string, string>;
  security: {
    score: number;
    grade: string;
    hasHsts: boolean;
    hasCsp: boolean;
    hasXfo: boolean;
    hasXcto: boolean;
    hasReferrer: boolean;
    hasPermissions: boolean;
  };
}

export function HttpInspectCard({ initialUrl = "https://cloudflare.com" }: { initialUrl?: string }) {
  const [targetUrl, setTargetUrl] = useState<string>(initialUrl);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<InspectData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleInspect() {
    if (!targetUrl.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/http-inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inspection failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mt-4 border-radar-teal/20">
      <CardHeader>
        <CardTitle>
          <Shield className="w-4 h-4 text-radar-teal" />
          HTTP Protocol & Security Headers Audit
        </CardTitle>
        <Badge variant="teal">Security Posture</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-radar-muted">
          Deep inspection of remote HTTP protocol version, HTTP/3 QUIC capability, and defense-in-depth security response headers:
        </p>

        {/* Input & Action */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-radar-bg border border-radar-border rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-radar-subtle focus:outline-none focus:ring-1 focus:ring-radar-teal"
          />
          <Button
            size="sm"
            onClick={handleInspect}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Audit Headers & Protocol
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-4 pt-1">
            {/* Header summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[10px] font-mono text-radar-subtle uppercase block">Security Grade</span>
                <span
                  className={`text-2xl font-black font-mono mt-0.5 block ${
                    data.security.grade === "A"
                      ? "text-emerald-400"
                      : data.security.grade === "B"
                      ? "text-radar-teal"
                      : "text-amber-400"
                  }`}
                >
                  Grade {data.security.grade}
                </span>
                <span className="text-[10px] text-radar-muted">{data.security.score}/100 Score</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[10px] font-mono text-radar-subtle uppercase block">Protocol Class</span>
                <span className="text-base font-bold font-mono text-white mt-1 block">
                  {data.httpVersion}
                </span>
                <span className="text-[10px] text-radar-muted">Transport Layer</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[10px] font-mono text-radar-subtle uppercase block">HTTP Status</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {data.status} {data.statusText}
                </span>
                <span className="text-[10px] text-radar-muted">Edge Response</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[10px] font-mono text-radar-subtle uppercase block">Server Software</span>
                <span className="text-sm font-bold font-mono text-white mt-1 block truncate">
                  {data.headers["server"] || "Hidden / Obscured"}
                </span>
                <span className="text-[10px] text-radar-muted">Banner Header</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-radar-bg border border-radar-border flex items-center justify-between">
                <span>HSTS (SSL Enforce)</span>
                {data.security.hasHsts ? (
                  <Badge variant="emerald" className="text-[9px]">Enabled</Badge>
                ) : (
                  <Badge variant="rose" className="text-[9px]">Missing</Badge>
                )}
              </div>

              <div className="p-2.5 rounded bg-radar-bg border border-radar-border flex items-center justify-between">
                <span>CSP Policy</span>
                {data.security.hasCsp ? (
                  <Badge variant="emerald" className="text-[9px]">Configured</Badge>
                ) : (
                  <Badge variant="amber" className="text-[9px]">Missing</Badge>
                )}
              </div>

              <div className="p-2.5 rounded bg-radar-bg border border-radar-border flex items-center justify-between">
                <span>X-Frame-Options</span>
                {data.security.hasXfo ? (
                  <Badge variant="emerald" className="text-[9px]">Protected</Badge>
                ) : (
                  <Badge variant="rose" className="text-[9px]">Missing</Badge>
                )}
              </div>
            </div>

            {/* Full raw headers drawer */}
            <div className="space-y-1">
              <span className="text-xs font-mono text-radar-subtle uppercase block">
                Raw Response Headers ({Object.keys(data.headers).length})
              </span>
              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border text-[11px] font-mono max-h-48 overflow-y-auto space-y-1">
                {Object.entries(data.headers).map(([key, val]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-radar-teal shrink-0">{key}:</span>
                    <span className="text-slate-300 break-all">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
