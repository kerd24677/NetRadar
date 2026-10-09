import { describe, it, expect } from "vitest";
import { calculateStabilityStats } from "./stabilityAnalytics";
import { StabilityProbePoint } from "@/types/stability";

describe("stabilityAnalytics", () => {
  it("should return zeros for empty dataset", () => {
    const stats = calculateStabilityStats([]);
    expect(stats.totalSent).toBe(0);
    expect(stats.minLatency).toBe(0);
    expect(stats.meanLatency).toBe(0);
    expect(stats.failureRatio).toBe(0);
  });

  it("should calculate min, max, mean, median, and p95 accurately", () => {
    // Latencies: 10, 20, 30, 40, 50 ms
    const points: StabilityProbePoint[] = [10, 20, 30, 40, 50].map((lat, idx) => ({
      id: `pt_${idx}`,
      seq: idx + 1,
      timestamp: 1000 + idx * 1000,
      target: "https://1.1.1.1",
      durationMs: lat,
      status: "success",
    }));

    const stats = calculateStabilityStats(points);
    expect(stats.totalSent).toBe(5);
    expect(stats.completedCount).toBe(5);
    expect(stats.failedCount).toBe(0);
    expect(stats.minLatency).toBe(10);
    expect(stats.maxLatency).toBe(50);
    expect(stats.meanLatency).toBe(30);
    expect(stats.medianLatency).toBe(30);
    expect(stats.p95Latency).toBe(50);
  });

  it("should compute RFC 3550 inter-arrival jitter properly", () => {
    // Latencies: 10, 20, 15 ms
    // Step 1: |20 - 10| = 10
    // Step 2: |15 - 20| = 5
    // Mean jitter = (10 + 5) / 2 = 7.5 ms
    const points: StabilityProbePoint[] = [10, 20, 15].map((lat, idx) => ({
      id: `pt_${idx}`,
      seq: idx + 1,
      timestamp: 1000 + idx * 1000,
      target: "https://1.1.1.1",
      durationMs: lat,
      status: "success",
    }));

    const stats = calculateStabilityStats(points);
    expect(stats.jitter).toBe(7.5);
  });

  it("should detect outage intervals, consecutive failures, and recovery times", () => {
    const points: StabilityProbePoint[] = [
      { id: "1", seq: 1, timestamp: 1000, target: "https://1.1.1.1", durationMs: 25, status: "success" },
      // Outage starts at 2000
      { id: "2", seq: 2, timestamp: 2000, target: "https://1.1.1.1", durationMs: 0, status: "error", errorDetails: "Timeout" },
      { id: "3", seq: 3, timestamp: 3000, target: "https://1.1.1.1", durationMs: 0, status: "error", errorDetails: "Timeout" },
      // Recovered at 4000
      { id: "4", seq: 4, timestamp: 4000, target: "https://1.1.1.1", durationMs: 32, status: "success" },
    ];

    const stats = calculateStabilityStats(points);
    expect(stats.totalSent).toBe(4);
    expect(stats.completedCount).toBe(2);
    expect(stats.failedCount).toBe(2);
    expect(stats.failureRatio).toBe(50);
    expect(stats.maxConsecutiveFailures).toBe(2);
    expect(stats.consecutiveFailures).toBe(0); // Currently recovered
    expect(stats.outageCount).toBe(1);

    const outage = stats.outages[0];
    expect(outage.startTime).toBe(2000);
    expect(outage.endTime).toBe(4000);
    expect(outage.failedRequestsCount).toBe(2);
    expect(outage.recoveryTimeMs).toBe(32);
  });

  it("should calculate exact 95th percentile on 100-probe dataset", () => {
    // 1 to 100 ms
    const points: StabilityProbePoint[] = Array.from({ length: 100 }, (_, i) => ({
      id: `pt_${i + 1}`,
      seq: i + 1,
      timestamp: 1000 + i * 1000,
      target: "https://1.1.1.1",
      durationMs: i + 1,
      status: "success",
    }));

    const stats = calculateStabilityStats(points);
    expect(stats.minLatency).toBe(1);
    expect(stats.maxLatency).toBe(100);
    expect(stats.medianLatency).toBe(50.5);
    expect(stats.p95Latency).toBe(95);
  });

  it("should track an active ongoing outage if session terminates before recovery", () => {
    const points: StabilityProbePoint[] = [
      { id: "1", seq: 1, timestamp: 1000, target: "https://1.1.1.1", durationMs: 20, status: "success" },
      { id: "2", seq: 2, timestamp: 2000, target: "https://1.1.1.1", durationMs: 0, status: "error", errorDetails: "Connection refused" },
      { id: "3", seq: 3, timestamp: 3000, target: "https://1.1.1.1", durationMs: 0, status: "error", errorDetails: "Connection refused" },
    ];

    const stats = calculateStabilityStats(points);
    expect(stats.outageCount).toBe(1);
    expect(stats.consecutiveFailures).toBe(2);
    expect(stats.maxConsecutiveFailures).toBe(2);
    expect(stats.outages[0].endTime).toBeUndefined();
    expect(stats.outages[0].durationMs).toBe(1000); // 3000 - 2000
    expect(stats.outages[0].failedRequestsCount).toBe(2);
  });
});
