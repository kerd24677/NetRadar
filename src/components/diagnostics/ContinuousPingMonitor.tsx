"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { measureHttpLatency } from "@/lib/diagnostics/httpPing";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Play, Pause, RotateCcw, Activity } from "lucide-react";

interface ContinuousPingMonitorProps {
  targetUrl: string;
}

interface PingDataPoint {
  seq: number;
  time: string;
  latency: number;
}

export function ContinuousPingMonitor({ targetUrl }: ContinuousPingMonitorProps) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [pingData, setPingData] = useState<PingDataPoint[]>([]);
  const [stats, setStats] = useState<{
    sent: number;
    lost: number;
    min: number;
    max: number;
    avg: number;
    jitter: number;
    current: number;
  }>({ sent: 0, lost: 0, min: 0, max: 0, avg: 0, jitter: 0, current: 0 });

  const activeRef = useRef<boolean>(false);
  activeRef.current = isActive;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const latenciesRef = useRef<number[]>([]);
  const countRef = useRef<number>(0);

  function resetStats() {
    setIsActive(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    latenciesRef.current = [];
    countRef.current = 0;
    setPingData([]);
    setStats({ sent: 0, lost: 0, min: 0, max: 0, avg: 0, jitter: 0, current: 0 });
  }

  async function executeSingleTick() {
    if (!activeRef.current) return;

    countRef.current += 1;
    const seq = countRef.current;

    try {
      const res = await measureHttpLatency(targetUrl, { timeoutMs: 3000 });
      if (!activeRef.current) return;

      const latency = res.status !== "error" ? res.durationMs : 0;
      const isLost = res.status === "error";

      if (!isLost && latency > 0) {
        latenciesRef.current.push(latency);
        if (latenciesRef.current.length > 30) latenciesRef.current.shift();
      }

      const validLats = latenciesRef.current;
      const min = validLats.length > 0 ? Math.min(...validLats) : 0;
      const max = validLats.length > 0 ? Math.max(...validLats) : 0;
      const avg = validLats.length > 0
        ? Math.round((validLats.reduce((a, b) => a + b, 0) / validLats.length) * 10) / 10
        : 0;

      // Calculate Jitter (standard deviation)
      let jitter = 0;
      if (validLats.length > 1) {
        const variance =
          validLats.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / validLats.length;
        jitter = Math.round(Math.sqrt(variance) * 10) / 10;
      }

      setStats((prev) => ({
        sent: seq,
        lost: isLost ? prev.lost + 1 : prev.lost,
        min: Math.round(min * 10) / 10,
        max: Math.round(max * 10) / 10,
        avg,
        jitter,
        current: Math.round(latency * 10) / 10,
      }));

      const newPoint: PingDataPoint = {
        seq,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        latency: Math.round(latency * 10) / 10,
      };

      setPingData((prev) => [...prev.slice(-24), newPoint]);
    } catch (err) {
      console.warn("Continuous ping tick hatası:", err);
    }

    if (activeRef.current) {
      timerRef.current = setTimeout(executeSingleTick, 1100);
    }
  }

  function toggleActive() {
    if (isActive) {
      setIsActive(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setIsActive(true);
      activeRef.current = true;
      executeSingleTick();
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Card className="mt-4 border-radar-teal/20" glow={isActive}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isActive ? "text-radar-teal animate-pulse" : "text-radar-muted"}`} />
          <CardTitle>Sürekli Gerçek Zamanlı Ping & Seğirme (Jitter) Akışı</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? "teal" : "muted"} pulse={isActive}>
            {isActive ? "CANLI AKIŞ" : "BEKLEMEDE"}
          </Badge>
          <Button
            size="sm"
            variant={isActive ? "danger" : "primary"}
            onClick={toggleActive}
            leftIcon={isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          >
            {isActive ? "Duraklat" : "Akışı Başlat"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={resetStats}
            title="Verileri sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Real-time Telemetry Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
          <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
            <span className="text-[10px] font-mono text-radar-subtle uppercase block">Anlık</span>
            <span className="text-base font-bold font-mono text-radar-teal mt-0.5 block">
              {stats.current > 0 ? `${stats.current} ms` : "—"}
            </span>
          </div>

          <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
            <span className="text-[10px] font-mono text-radar-subtle uppercase block">Ortalama RTT</span>
            <span className="text-base font-bold font-mono text-slate-100 mt-0.5 block">
              {stats.avg > 0 ? `${stats.avg} ms` : "—"}
            </span>
          </div>

          <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
            <span className="text-[10px] font-mono text-radar-subtle uppercase block">Seğirme (Jitter σ)</span>
            <span className="text-base font-bold font-mono text-radar-cyan mt-0.5 block">
              {stats.jitter > 0 ? `±${stats.jitter} ms` : "0 ms"}
            </span>
          </div>

          <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
            <span className="text-[10px] font-mono text-radar-subtle uppercase block">Min / Maks</span>
            <span className="text-xs font-bold font-mono text-slate-200 mt-1 block">
              {stats.min}/{stats.max} ms
            </span>
          </div>

          <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
            <span className="text-[10px] font-mono text-radar-subtle uppercase block">Gönderilen</span>
            <span className="text-base font-bold font-mono text-slate-100 mt-0.5 block">
              {stats.sent}
            </span>
          </div>

          <div className="bg-radar-bg p-2.5 rounded-lg border border-radar-border">
            <span className="text-[10px] font-mono text-radar-subtle uppercase block">Kayıp Oranı</span>
            <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
              {stats.sent > 0 ? `${Math.round((stats.lost / stats.sent) * 100)}%` : "0%"}
            </span>
          </div>
        </div>

        {/* Live Recharts Pulse Wave */}
        <div className="h-44 w-full pt-1">
          {pingData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 rounded-lg bg-radar-bg border border-dashed border-radar-border text-xs text-radar-muted">
              <Activity className="w-6 h-6 text-radar-subtle mb-1" />
              <span>Gerçek zamanlı sürekli gecikme örneklemesini başlatmak için &apos;Akışı Başlat&apos; düğmesine dokunun.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pingData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} tickLine={false} fontFamily="monospace" />
                <YAxis stroke="#64748B" fontSize={9} tickLine={false} fontFamily="monospace" unit="ms" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as PingDataPoint;
                      return (
                        <div className="bg-radar-surface border border-radar-border p-2 rounded shadow text-xs font-mono">
                          <p className="text-radar-teal font-semibold">Sıra #{d.seq}</p>
                          <p className="text-white">Gecikme: {d.latency} ms</p>
                          <p className="text-radar-muted">{d.time}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#4DE0C1"
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={{ r: 2.5, fill: "#4DE0C1" }}
                  activeDot={{ r: 4, fill: "#6FFFD9" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
