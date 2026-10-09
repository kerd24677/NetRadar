"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { StabilityProbePoint, StabilitySession, StabilitySessionStats } from "@/types/stability";
import { calculateStabilityStats } from "@/lib/diagnostics/stabilityAnalytics";
import { measureHttpLatency } from "@/lib/diagnostics/httpPing";
import {
  saveStabilitySession,
  getAllStabilitySessions,
  deleteStabilitySession,
} from "@/lib/storage/stabilityStore";
import { generateStabilityCsv, downloadJsonFile } from "@/lib/exports/stabilityExport";
import { downloadCsvFile } from "@/lib/exports/csvExport";

import { StabilityControls } from "@/components/stability/StabilityControls";
import { StabilityKpis } from "@/components/stability/StabilityKpis";
import { StabilityChart } from "@/components/stability/StabilityChart";
import { OutageTimeline } from "@/components/stability/OutageTimeline";
import { StabilityEventLog } from "@/components/stability/StabilityEventLog";

import { Activity, Info, History, Trash2, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const INITIAL_STATS: StabilitySessionStats = {
  totalSent: 0,
  completedCount: 0,
  failedCount: 0,
  failureRatio: 0,
  consecutiveFailures: 0,
  maxConsecutiveFailures: 0,
  minLatency: 0,
  maxLatency: 0,
  meanLatency: 0,
  medianLatency: 0,
  p95Latency: 0,
  jitter: 0,
  outageCount: 0,
  outages: [],
};

export default function StabilityPage() {
  const [target, setTarget] = useState("https://1.1.1.1/cdn-cgi/trace");
  const [intervalMs, setIntervalMs] = useState(1000);
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [isRunning, setIsRunning] = useState(false);

  const [points, setPoints] = useState<StabilityProbePoint[]>([]);
  const [stats, setStats] = useState<StabilitySessionStats>(INITIAL_STATS);

  // Past Sessions Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pastSessions, setPastSessions] = useState<StabilitySession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Execution refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionRef = useRef<StabilitySession | null>(null);
  const pointsRef = useRef<StabilityProbePoint[]>([]);
  const seqRef = useRef(1);
  const isStoppedRef = useRef(true);

  // Load past sessions from IndexedDB on mount
  const loadPastSessions = useCallback(async () => {
    try {
      const items = await getAllStabilitySessions();
      setPastSessions(items);
    } catch (err) {
      console.warn("Error loading past stability sessions:", err);
    }
  }, []);

  useEffect(() => {
    loadPastSessions();
  }, [loadPastSessions]);

  // Recalculate stats whenever points change
  const updatePointsAndStats = useCallback((newPoints: StabilityProbePoint[]) => {
    pointsRef.current = newPoints;
    setPoints(newPoints);
    const newStats = calculateStabilityStats(newPoints);
    setStats(newStats);
    return newStats;
  }, []);

  // Stop current test and persist session
  const stopTest = useCallback(async () => {
    isStoppedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);

    if (currentSessionRef.current && pointsRef.current.length > 0) {
      const finalStats = calculateStabilityStats(pointsRef.current);
      const finishedSession: StabilitySession = {
        ...currentSessionRef.current,
        endTime: Date.now(),
        status: "completed",
        points: [...pointsRef.current],
        stats: finalStats,
      };

      try {
        await saveStabilitySession(finishedSession);
        await loadPastSessions();
      } catch (err) {
        console.warn("Failed to persist stability session:", err);
      }
    }
  }, [loadPastSessions]);

  // Single probe step
  const executeProbe = useCallback(
    async (currentTarget: string) => {
      if (isStoppedRef.current) return;
      const seq = seqRef.current++;
      const timestamp = Date.now();

      // Check if browser is offline
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const offlinePt: StabilityProbePoint = {
          id: `probe_${timestamp}_${seq}`,
          seq,
          timestamp,
          target: currentTarget,
          durationMs: 0,
          status: "offline",
          errorDetails: "Device has no active internet connection (navigator.onLine = false)",
        };
        const next = [...pointsRef.current, offlinePt];
        updatePointsAndStats(next);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const result = await measureHttpLatency(currentTarget, {
          timeoutMs: Math.min(intervalMs * 2, 6000),
          abortSignal: controller.signal,
        });

        if (isStoppedRef.current) return;

        const isOk = result.status === "success" || result.status === "opaque";
        const pt: StabilityProbePoint = {
          id: `probe_${timestamp}_${seq}`,
          seq,
          timestamp,
          target: currentTarget,
          durationMs: result.durationMs,
          status: isOk ? "success" : result.errorType === "TIMEOUT" ? "timeout" : "error",
          httpStatus: result.httpStatus,
          errorDetails: result.errorMessage,
        };

        const next = [...pointsRef.current, pt];
        updatePointsAndStats(next);
      } catch (err: unknown) {
        if (isStoppedRef.current) return;
        const errMessage = err instanceof Error ? err.message : String(err);
        const pt: StabilityProbePoint = {
          id: `probe_${timestamp}_${seq}`,
          seq,
          timestamp,
          target: currentTarget,
          durationMs: 0,
          status: "error",
          errorDetails: errMessage || "Fetch failed",
        };
        const next = [...pointsRef.current, pt];
        updatePointsAndStats(next);
      }
    },
    [intervalMs, updatePointsAndStats]
  );

  // Start new probe test
  const startTest = useCallback(() => {
    if (!target.trim()) return;

    // Reset sequence and active points
    seqRef.current = 1;
    pointsRef.current = [];
    setPoints([]);
    setStats(INITIAL_STATS);

    const sessionId = `stab_${Date.now()}`;
    setActiveSessionId(sessionId);

    const newSession: StabilitySession = {
      id: sessionId,
      target,
      intervalMs,
      startTime: Date.now(),
      status: "running",
      stats: INITIAL_STATS,
      points: [],
    };
    currentSessionRef.current = newSession;
    setIsRunning(true);
    isStoppedRef.current = false;

    // Sequential non-overlapping loop
    (async () => {
      const startTime = Date.now();
      const durationMs = durationMinutes > 0 ? durationMinutes * 60 * 1000 : Infinity;

      while (!isStoppedRef.current) {
        if (Date.now() - startTime >= durationMs) {
          break;
        }

        await executeProbe(target);

        if (isStoppedRef.current) break;

        // Delay between consecutive completed probes
        await new Promise<void>((resolve) => {
          timerRef.current = setTimeout(resolve, intervalMs);
        });
      }

      if (!isStoppedRef.current) {
        await stopTest();
      }
    })();
  }, [target, intervalMs, durationMinutes, executeProbe, stopTest]);

  // Reset test
  const resetTest = useCallback(() => {
    isStoppedRef.current = true;
    if (isRunning) stopTest();
    setPoints([]);
    pointsRef.current = [];
    setStats(INITIAL_STATS);
    setActiveSessionId(null);
    currentSessionRef.current = null;
  }, [isRunning, stopTest]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isStoppedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Export Active Session
  const handleExportCsv = useCallback(() => {
    const sessionToExport: StabilitySession = currentSessionRef.current
      ? { ...currentSessionRef.current, points, stats }
      : {
          id: activeSessionId || `stab_${Date.now()}`,
          target,
          intervalMs,
          startTime: points[0]?.timestamp || Date.now(),
          status: "completed",
          points,
          stats,
        };
    const csv = generateStabilityCsv(sessionToExport);
    downloadCsvFile(csv, `netradar-stability-${Date.now()}.csv`);
  }, [activeSessionId, target, intervalMs, points, stats]);

  const handleExportJson = useCallback(() => {
    const sessionToExport: StabilitySession = currentSessionRef.current
      ? { ...currentSessionRef.current, points, stats }
      : {
          id: activeSessionId || `stab_${Date.now()}`,
          target,
          intervalMs,
          startTime: points[0]?.timestamp || Date.now(),
          status: "completed",
          points,
          stats,
        };
    downloadJsonFile(sessionToExport, `netradar-stability-${Date.now()}.json`);
  }, [activeSessionId, target, intervalMs, points, stats]);

  // Load a past session from History
  const loadPastSession = (session: StabilitySession) => {
    if (isRunning) stopTest();
    setActiveSessionId(session.id);
    setTarget(session.target);
    setIntervalMs(session.intervalMs);
    setPoints(session.points);
    pointsRef.current = session.points;
    setStats(session.stats || calculateStabilityStats(session.points));
    setIsHistoryOpen(false);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteStabilitySession(id);
    await loadPastSessions();
    if (activeSessionId === id) {
      resetTest();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title & History Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-radar-teal" />
            Connection Stability Analytics
          </h1>
          <p className="text-xs sm:text-sm text-radar-subtle mt-0.5">
            Continuous HTTP jitter variance, tail latency percentiles, and outage recovery tracking
          </p>
        </div>

        <Button
          onClick={() => setIsHistoryOpen(true)}
          variant="outline"
          className="border-radar-border hover:bg-radar-surface text-slate-300 text-xs flex items-center gap-1.5"
        >
          <History className="w-3.5 h-3.5 text-radar-teal" />
          Saved Sessions ({pastSessions.length})
        </Button>
      </div>

      {/* Honest Boundary Notice */}
      <div className="bg-radar-surface/60 border border-radar-border/80 rounded-xl p-3 sm:p-4 flex items-start gap-3 text-xs font-mono text-radar-subtle">
        <Info className="w-4 h-4 text-radar-teal shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Technical Note: </span>
          NetRadar conducts live HTTP/HTTPS probes with high-resolution{" "}
          <code className="text-radar-teal font-semibold">performance.now()</code> timers. Browser security prevents raw ICMP ping generation, so the Failure Ratio represents true application-layer HTTP roundtrip failures rather than ICMP packet drops.
        </div>
      </div>

      {/* 1. Control Panel */}
      <StabilityControls
        isRunning={isRunning}
        target={target}
        intervalMs={intervalMs}
        durationMinutes={durationMinutes}
        onTargetChange={setTarget}
        onIntervalChange={setIntervalMs}
        onDurationChange={setDurationMinutes}
        onStart={startTest}
        onStop={stopTest}
        onReset={resetTest}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        hasData={points.length > 0}
      />

      {/* 2. KPI Metrics */}
      <StabilityKpis stats={stats} isRunning={isRunning} />

      {/* 3. Time Series Chart */}
      <StabilityChart points={points} p95Latency={stats.p95Latency} />

      {/* 4. Outage Timeline & Details */}
      <OutageTimeline outages={stats.outages} totalSent={stats.totalSent} />

      {/* 5. Event Log */}
      <StabilityEventLog points={points} p95Latency={stats.p95Latency} />

      {/* History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Saved Stability Sessions"
      >
        <div className="space-y-3">
          <p className="text-xs text-radar-subtle">
            All continuous stability runs are indexed locally inside browser IndexedDB.
          </p>

          {pastSessions.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-radar-subtle bg-radar-bg rounded-lg border border-dashed border-radar-border">
              No saved stability sessions found.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {pastSessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => loadPastSession(s)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-3 text-xs font-mono ${
                    activeSessionId === s.id
                      ? "bg-radar-teal/10 border-radar-teal/60 text-slate-100"
                      : "bg-radar-bg border-radar-border hover:border-slate-600 text-slate-300"
                  }`}
                >
                  <div className="flex-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 truncate">{s.target}</span>
                      <span className="text-[10px] text-radar-subtle">
                        {new Date(s.startTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-radar-subtle mt-1">
                      <span>Probes: {s.points.length}</span>
                      <span>Mean: {s.stats?.meanLatency || 0}ms</span>
                      <span>p95: {s.stats?.p95Latency || 0}ms</span>
                      <span
                        className={
                          s.stats?.failureRatio > 0 ? "text-amber-400" : "text-emerald-400"
                        }
                      >
                        Fail: {s.stats?.failureRatio || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-radar-subtle" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
