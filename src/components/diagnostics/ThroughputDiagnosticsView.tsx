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
        const dirLabel = res.direction === "download" ? "İndirme" : "Yükleme";
        await saveHistoryItem({
          id: `speed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          category: "speed",
          target: `${dirLabel.toUpperCase()} (${formatBytes(res.bytesTransferred)})`,
          startTime: res.timestamp - Math.round(res.durationMs),
          endTime: res.timestamp,
          durationMs: res.durationMs,
          status: "success",
          summary: `${formatSpeed(res.mbps)} (${dirLabel}) / ${formatDuration(res.durationMs)}`,
          details: { speed: res },
        });
      }
    } catch (err) {
      console.error("Speed test hatası:", err);
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
            Kontrollü Veri Akış Hızı (Throughput) Ölçümü
          </CardTitle>
          <Badge variant="teal">Gerçek Veri Yükü Transferi</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-lg bg-radar-elevated/40 border border-radar-border text-xs text-radar-muted space-y-1.5">
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <Info className="w-4 h-4 text-radar-cyan shrink-0" />
              <span>Tanılama Dürüstlüğü Bildirimi</span>
            </div>
            <p>
              NetRadar, kontrollü API uç noktalarına karşı (
              <code className="text-radar-teal font-mono">/api/speed/download</code> &{" "}
              <code className="text-radar-teal font-mono">/api/speed/upload</code>) gerçek ikili veri akışı testleri gerçekleştirir. Asla sahte bir hız göstergesi canlandırmaz veya yapay sayılar üretmez.
            </p>
            <p className="text-[11px] text-radar-subtle">
              Ölçümler, ağ gecikmesi, TCP pencereleme ve sunucu işlem gücü kısıtları altında bu istemci ile ana dağıtım sunucusu arasındaki gerçek uçtan uca veri hızını yansıtır.
            </p>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">Test Yönü</label>
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
                  İndirme (Download)
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
                  Yükleme (Upload)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-radar-subtle block">Veri Yükü Boyutu</label>
              <select
                value={sizeMb}
                onChange={(e) => setSizeMb(Number(e.target.value))}
                disabled={isRunning}
                className="w-full bg-radar-bg border border-radar-border rounded-lg px-3 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-radar-teal"
              >
                <option value={1}>1.0 MB (Hızlı Kontrol)</option>
                <option value={2}>2.0 MB (Standart)</option>
                <option value={5}>5.0 MB (Kapsamlı)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            {!isRunning ? (
              <Button
                onClick={handleStartTest}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                {direction === "download" ? "İndirme" : "Yükleme"} Testini Başlat
              </Button>
            ) : (
              <Button
                onClick={handleCancelTest}
                variant="danger"
                leftIcon={<StopCircle className="w-4 h-4" />}
              >
                Ölçümü İptal Et
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
              Veri Akışı Aktarılıyor ({direction === "download" ? "İNDİRME" : "YÜKLEME"})
            </CardTitle>
            <Badge variant="teal" pulse={true}>
              CANLI AKIŞ
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                {progress.currentMbps.toFixed(2)}
              </span>
              <span className="text-sm font-mono text-radar-teal ml-1">Mbps</span>
              <p className="text-xs text-radar-muted font-mono mt-1">
                Aktarılan: {formatBytes(progress.transferredBytes)} / {formatBytes(progress.totalExpectedBytes)}
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
              Veri Akış Hızı Özeti ({lastResult.direction === "download" ? "İNDİRME" : "YÜKLEME"})
            </CardTitle>
            <Badge variant={lastResult.status === "success" ? "emerald" : "rose"}>
              {lastResult.status === "success" ? "BAŞARILI" : "HATA"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Efektif Hız</span>
                <span className="text-xl font-bold font-mono text-radar-teal mt-0.5 block">
                  {formatSpeed(lastResult.mbps)}
                </span>
                <span className="text-[10px] text-radar-muted">Megabit / saniye</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Aktarılan Veri</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {formatBytes(lastResult.bytesTransferred)}
                </span>
                <span className="text-[10px] text-radar-muted">İkili veri yükü</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Geçen Süre</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {formatDuration(lastResult.durationMs)}
                </span>
                <span className="text-[10px] text-radar-muted">İstemci akış süresi</span>
              </div>

              <div className="bg-radar-bg p-3 rounded-lg border border-radar-border">
                <span className="text-[11px] font-mono text-radar-subtle uppercase block">Uç Nokta</span>
                <span className="text-xs font-bold font-mono text-white mt-1 block truncate">
                  {lastResult.endpoint}
                </span>
                <span className="text-[10px] text-radar-muted">NetRadar API rotası</span>
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
