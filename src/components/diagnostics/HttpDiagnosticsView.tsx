"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { measureHttpLatency } from "@/lib/diagnostics/httpPing";
import { saveHistoryItem } from "@/lib/storage/historyStore";
import { HttpDiagnosticResult } from "@/types/diagnostics";
import { formatDuration } from "@/lib/utils/formatters";
import { Globe, AlertTriangle, Clock, RefreshCw } from "lucide-react";

export function HttpDiagnosticsView() {
  const [urlInput, setUrlInput] = useState<string>("https://cloudflare.com");
  const [timeoutMs, setTimeoutMs] = useState<number>(5000);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<HttpDiagnosticResult | null>(null);

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
        summary: `HTTP latency ${formatDuration(res.durationMs)} (${res.statusText || res.status})`,
        details: { http: res },
        errorMessage: res.errorMessage,
      });
    } catch (err) {
      console.error("HTTP test error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Globe className="w-4 h-4 text-radar-teal" />
            HTTP / HTTPS Response Latency & Availability
          </CardTitle>
          <Badge variant="teal">Application Layer</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-lg bg-radar-elevated/40 border border-radar-border text-xs text-radar-muted space-y-1">
            <p className="text-slate-200 font-medium">Technical Specification:</p>
            <p>
              Measures genuine application-layer HTTP/HTTPS round-trip time from client to target using{" "}
              <code className="text-radar-teal font-mono">performance.now()</code>. This encompasses DNS resolution, TLS handshake, request transfer, and first-byte response.
            </p>
            <p className="text-radar-amber font-mono text-[11px] pt-1">
              Notice: This is NOT an ICMP ping. Web browsers operate inside security sandboxes and cannot emit raw ICMP echo requests.
            </p>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">Target Endpoint</label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com or hostname"
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder:text-radar-subtle focus:outline-none focus:ring-1 focus:ring-radar-teal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">Timeout</label>
              <select
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(Number(e.target.value))}
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-teal"
              >
                <option value={2000}>2,000 ms (2s)</option>
                <option value={5000}>5,000 ms (5s)</option>
                <option value={10000}>10,000 ms (10s)</option>
              </select>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-radar-subtle font-mono">Quick Targets:</span>
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
                className="text-xs font-mono px-2 py-1 rounded bg-radar-bg hover:bg-radar-elevated border border-radar-border text-slate-300 hover:text-radar-teal transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <Button
              onClick={handleExecuteTest}
              isLoading={isLoading}
              disabled={!urlInput.trim()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Execute HTTP Probe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result Display */}
      {result && (
        <Card glow={result.status === "success"}>
          <CardHeader>
            <CardTitle>
              <Clock className="w-4 h-4 text-radar-teal" />
              Measurement Report
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
              {result.status.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Round-Trip Duration</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {formatDuration(result.durationMs)}
                </span>
                <span className="text-[10px] text-radar-muted">performance.now()</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">HTTP Status</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {result.httpStatus !== undefined && result.httpStatus > 0
                    ? result.httpStatus
                    : result.isOpaqueResponse
                    ? "0 (Opaque)"
                    : "N/A"}
                </span>
                <span className="text-[10px] text-radar-muted truncate block">
                  {result.statusText || "Response code"}
                </span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Protocol</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block uppercase">
                  {result.protocol ? result.protocol.replace(":", "") : "HTTPS"}
                </span>
                <span className="text-[10px] text-radar-muted">Scheme</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">CORS Isolation</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block">
                  {result.isOpaqueResponse ? "Opaque" : "Standard"}
                </span>
                <span className="text-[10px] text-radar-muted">Browser Policy</span>
              </div>
            </div>

            <div className="bg-radar-bg p-3 rounded-lg border border-radar-border space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-radar-subtle">Normalized URL:</span>
                <span className="text-slate-200 truncate max-w-sm">{result.normalizedUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-radar-subtle">Completed At:</span>
                <span className="text-slate-200">{new Date(result.timestamp).toISOString()}</span>
              </div>
            </div>

            {/* Explanatory notes */}
            {result.isOpaqueResponse && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Cross-Origin Resource Sharing (CORS) Policy:</strong> The remote server received the HTTP request and replied, but did not grant cross-origin access headers. The browser isolates header visibility (status 0), but the round-trip latency measurement of {formatDuration(result.durationMs)} is verified and accurate.
                </p>
              </div>
            )}

            {result.errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  <strong>Diagnostic Detail:</strong> {result.errorMessage}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
