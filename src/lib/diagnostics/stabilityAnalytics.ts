import { OutageInterval, StabilityProbePoint, StabilitySessionStats } from "@/types/stability";

/**
 * Calculates accurate connection stability analytics from probe points.
 * All metrics derive strictly from genuine observations without fabrication.
 */
export function calculateStabilityStats(
  points: StabilityProbePoint[],
  previousStats?: StabilitySessionStats
): StabilitySessionStats {
  if (points.length === 0) {
    return {
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
  }

  const completed = points.filter((p) => p.status === "success" && p.durationMs > 0);
  const failed = points.filter((p) => p.status !== "success");
  const completedCount = completed.length;
  const failedCount = failed.length;
  const totalSent = points.length;
  const failureRatio = totalSent > 0 ? Math.round((failedCount / totalSent) * 1000) / 10 : 0;

  // Extract latencies of successful probes
  const latencies = completed.map((p) => p.durationMs).sort((a, b) => a - b);

  let minLatency = 0;
  let maxLatency = 0;
  let meanLatency = 0;
  let medianLatency = 0;
  let p95Latency = 0;

  if (latencies.length > 0) {
    minLatency = Math.round(latencies[0] * 10) / 10;
    maxLatency = Math.round(latencies[latencies.length - 1] * 10) / 10;

    const sum = latencies.reduce((acc, v) => acc + v, 0);
    meanLatency = Math.round((sum / latencies.length) * 10) / 10;

    // Median
    const mid = Math.floor(latencies.length / 2);
    medianLatency =
      latencies.length % 2 === 0
        ? Math.round(((latencies[mid - 1] + latencies[mid]) / 2) * 10) / 10
        : Math.round(latencies[mid] * 10) / 10;

    // p95 percentile (standard nearest-rank method: ceil(P/100 * N) - 1)
    const p95Index = Math.max(
      0,
      Math.min(latencies.length - 1, Math.ceil(latencies.length * 0.95) - 1)
    );
    p95Latency = Math.round(latencies[p95Index] * 10) / 10;
  }

  // Application-Layer Delay Variance (RFC 3550 Mean Absolute Differences formulation)
  // Formula: J = sum(|D[i] - D[i-1]|) / (N - 1)
  // Note: Measures successive variance in HTTP round-trip latency. In a web browser environment,
  // this is an application-level approximation and cannot measure raw IP/UDP packet transit jitter.
  let jitter = 0;
  if (completed.length > 1) {
    let diffSum = 0;
    for (let i = 1; i < completed.length; i++) {
      diffSum += Math.abs(completed[i].durationMs - completed[i - 1].durationMs);
    }
    jitter = Math.round((diffSum / (completed.length - 1)) * 10) / 10;
  }

  // Calculate Outage Intervals and Consecutive Failures
  const outages: OutageInterval[] = [];
  let currentConsecutiveFailures = 0;
  let maxConsecutiveFailures = previousStats?.maxConsecutiveFailures || 0;
  let currentOutage: OutageInterval | null = null;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];

    if (pt.status !== "success") {
      currentConsecutiveFailures++;
      if (currentConsecutiveFailures > maxConsecutiveFailures) {
        maxConsecutiveFailures = currentConsecutiveFailures;
      }

      // If this is the start of an outage (or continuing an outage)
      if (!currentOutage) {
        currentOutage = {
          id: `outage_${pt.timestamp}_${i}`,
          startTime: pt.timestamp,
          failedRequestsCount: 1,
          reason: pt.errorDetails || "HTTP request failure / unreachable endpoint",
        };
      } else {
        currentOutage.failedRequestsCount++;
      }
    } else {
      // Success: check if recovering from an outage
      if (currentOutage) {
        currentOutage.endTime = pt.timestamp;
        currentOutage.durationMs = pt.timestamp - currentOutage.startTime;
        currentOutage.recoveryTimeMs = pt.durationMs; // Time it took for the recovering request to complete
        outages.push(currentOutage);
        currentOutage = null;
      }
      currentConsecutiveFailures = 0;
    }
  }

  // If currently active outage still ongoing
  if (currentOutage) {
    const lastPoint = points[points.length - 1];
    currentOutage.durationMs = lastPoint.timestamp - currentOutage.startTime;
    outages.push(currentOutage);
  }

  return {
    totalSent,
    completedCount,
    failedCount,
    failureRatio,
    consecutiveFailures: currentConsecutiveFailures,
    maxConsecutiveFailures,
    minLatency,
    maxLatency,
    meanLatency,
    medianLatency,
    p95Latency,
    jitter,
    outageCount: outages.length,
    outages,
  };
}
