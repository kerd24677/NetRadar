export interface StabilityProbePoint {
  id: string;
  seq: number;
  timestamp: number;
  target: string;
  durationMs: number;
  status: "success" | "error" | "timeout" | "offline";
  httpStatus?: number;
  errorDetails?: string;
}

export interface OutageInterval {
  id: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  recoveryTimeMs?: number;
  failedRequestsCount: number;
  reason: string;
}

export interface StabilitySessionStats {
  totalSent: number;
  completedCount: number;
  failedCount: number;
  failureRatio: number; // 0 to 100%
  consecutiveFailures: number;
  maxConsecutiveFailures: number;
  minLatency: number;
  maxLatency: number;
  meanLatency: number;
  medianLatency: number;
  p95Latency: number;
  jitter: number; // RFC 3550 delay variance in ms
  outageCount: number;
  outages: OutageInterval[];
}

export interface StabilitySession {
  id: string;
  target: string;
  intervalMs: number;
  startTime: number;
  endTime?: number;
  status: "running" | "completed" | "stopped";
  stats: StabilitySessionStats;
  points: StabilityProbePoint[];
}
