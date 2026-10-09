"use client";

import React, { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { runDownloadSpeedTest, runUploadSpeedTest } from "@/lib/diagnostics/speedTest";
import { saveHistoryItem } from "@/lib/storage/historyStore";
import { SpeedTestResult } from "@/types/diagnostics";
import { formatBytes, formatDuration, formatSpeed } from "@/lib/utils/formatters";
import { Gauge, ArrowDownCircle, ArrowUpCircle, Info, StopCircle, RefreshCw } from "lucide-react";

export function ThroughputDiagnosticsView() {
  const [direction, setDirection] = useState<"download" | "upload">("download");
  const [sizeMb, setSizeMb] = useState<number>(2);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{
    percent: number;
    currentMbps: number;
    transferredBytes: number;
    totalExpectedBytes: number;
  }>({ percent: 0, currentMbps: 0, transferredBytes: 0, totalExpectedBytes: 0 });
  const [lastResult, setLastResult] = useState<SpeedTestResult | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  async function handleStartTest() {
    if (isRunning) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRunning(true);
    setProgress({ percent: 0, currentMbps: 0, transferredBytes: 0, totalExpectedBytes: sizeMb * 1024 * 1024 });
    setLastResult(null);

    try {
      let res: SpeedTestResult;

      if (direction === "download") {
        res = await runDownloadSpeedTest({
          sizeMb,
          abortSignal: controller.signal,
          onProgress: (p) => setProgress(p),
        });
      } else {
        res = await runUploadSpeedTest({
          sizeMb,
          abortSignal: controller.signal,
          onProgress: (p) => setProgress(p),
        });
      }

      setLastResult(res);

      if (res.status === "success") {
        await saveHistoryItem({
          id: `speed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          category: "speed",
          target: `${res.direction.toUpperCase()} (${formatBytes(res.bytesTransferred)})`,
          startTime: res.timestamp - Math.round(res.durationMs),
          endTime: res.timestamp,
          durationMs: res.durationMs,
          status: "success",
          summary: `${formatSpeed(res.mbps)} (${res.direction}) over ${formatDuration(res.durationMs)}`,
          details: { speed: res },
        });
      }
    } catch (err) {
      console.error("Speed test error:", err);
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  }

  function handleCancelTest() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Gauge className="w-4 h-4 text-radar-teal" />
            Controlled Throughput Measurement
          </CardTitle>
          <Badge variant="teal">Real Payload Transfer</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-lg bg-radar-elevated/40 border border-radar-border text-xs text-radar-muted space-y-1.5">
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <Info className="w-4 h-4 text-radar-cyan shrink-0" />
              <span>Diagnostic Integrity Notice</span>
            </div>
            <p>
              NetRadar performs genuine binary streaming tests against controlled endpoints (
              <code className="text-radar-teal font-mono">/api/speed/download</code> &{" "}
              <code className="text-radar-teal font-mono">/api/speed/upload</code>). It never animates a fake speedometer or invents numbers.
            </p>
            <p className="text-[11px] text-radar-subtle">
              Measurements reflect actual end-to-end throughput between this client and the host deployment server, constrained by network latency, TCP windowing, and server compute.
            </p>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">Test Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection("download")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                    direction === "download"
                      ? "bg-radar-elevated text-radar-teal border-radar-teal/40 shadow-noc-glow"
                      : "bg-radar-bg text-slate-400 border-radar-border hover:bg-radar-elevated/50"
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Download
                </button>

                <button
                  type="button"
                  onClick={() => setDirection("upload")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                    direction === "upload"
                      ? "bg-radar-elevated text-radar-teal border-radar-teal/40 shadow-noc-glow"
                      : "bg-radar-bg text-slate-400 border-radar-border hover:bg-radar-elevated/50"
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Upload
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">Payload Size</label>
              <select
                value={sizeMb}
                onChange={(e) => setSizeMb(Number(e.target.value))}
                disabled={isRunning}
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-teal"
              >
                <option value={1}>1.0 MB (Fast check)</option>
                <option value={2}>2.0 MB (Standard)</option>
                <option value={5}>5.0 MB (Thorough)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            {!isRunning ? (
              <Button
                onClick={handleStartTest}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Run {direction.toUpperCase()} Test
              </Button>
            ) : (
              <Button
                onClick={handleCancelTest}
                variant="danger"
                leftIcon={<StopCircle className="w-4 h-4" />}
              >
                Cancel Measurement
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Measurement / Progress */}
      {isRunning && (
        <Card glow={true}>
          <CardHeader>
            <CardTitle>
              <Gauge className="w-4 h-4 text-radar-teal animate-spin" />
              Transferring Stream ({direction.toUpperCase()})
            </CardTitle>
            <Badge variant="teal" pulse={true}>
              LIVE STREAM
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                {progress.currentMbps.toFixed(2)}
              </span>
              <span className="text-sm font-mono text-radar-teal ml-1">Mbps</span>
              <p className="text-xs text-radar-muted font-mono mt-1">
                Transferred {formatBytes(progress.transferredBytes)} of {formatBytes(progress.totalExpectedBytes)}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-radar-bg h-2 rounded-full overflow-hidden border border-radar-border">
              <div
                className="bg-radar-teal h-full transition-all duration-150"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-radar-subtle">
              <span>0%</span>
              <span>{progress.percent}%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Result Card */}
      {lastResult && !isRunning && (
        <Card glow={lastResult.status === "success"}>
          <CardHeader>
            <CardTitle>
              <Gauge className="w-4 h-4 text-radar-teal" />
              Throughput Summary ({lastResult.direction.toUpperCase()})
            </CardTitle>
            <Badge variant={lastResult.status === "success" ? "emerald" : "rose"}>
              {lastResult.status.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Effective Speed</span>
                <span className="text-xl font-bold font-mono text-radar-teal mt-0.5 block">
                  {formatSpeed(lastResult.mbps)}
                </span>
                <span className="text-[10px] text-radar-muted">Megabits / second</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Transferred</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {formatBytes(lastResult.bytesTransferred)}
                </span>
                <span className="text-[10px] text-radar-muted">Binary payload</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Elapsed Time</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {formatDuration(lastResult.durationMs)}
                </span>
                <span className="text-[10px] text-radar-muted">Client stream duration</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Endpoint</span>
                <span className="text-xs font-bold font-mono text-white mt-1 block truncate">
                  {lastResult.endpoint}
                </span>
                <span className="text-[10px] text-radar-muted">NetRadar API route</span>
              </div>
            </div>

            {lastResult.errorMessage && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                {lastResult.errorMessage}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
