import { SpeedTestResult } from "@/types/diagnostics";

export interface SpeedTestOptions {
  sizeMb?: number;
  abortSignal?: AbortSignal;
  onProgress?: (progress: {
    transferredBytes: number;
    totalExpectedBytes: number;
    currentMbps: number;
    percent: number;
  }) => void;
}

/**
 * Runs genuine download throughput measurement against NetRadar server endpoint.
 * Measures actual byte transfer stream and calculates real-time Mbps.
 */
export async function runDownloadSpeedTest(
  options: SpeedTestOptions = {}
): Promise<SpeedTestResult> {
  const sizeMb = options.sizeMb ?? 2;
  const endpoint = `/api/speed/download?sizeMb=${sizeMb}&t=${Date.now()}`;
  const startTime = performance.now();
  let transferredBytes = 0;

  try {
    const res = await fetch(endpoint, {
      signal: options.abortSignal,
      cache: "no-store",
    });

    if (!res.ok || !res.body) {
      throw new Error(`Speed test server returned HTTP ${res.status}`);
    }

    const contentLength = res.headers.get("Content-Length");
    const totalExpectedBytes = contentLength
      ? parseInt(contentLength, 10)
      : sizeMb * 1024 * 1024;

    const reader = res.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        transferredBytes += value.byteLength;
        const currentElapsedSec = (performance.now() - startTime) / 1000;
        if (currentElapsedSec > 0 && options.onProgress) {
          const currentMbps = (transferredBytes * 8) / (currentElapsedSec * 1_000_000);
          const percent = Math.min(100, Math.round((transferredBytes / totalExpectedBytes) * 100));
          options.onProgress({
            transferredBytes,
            totalExpectedBytes,
            currentMbps: Math.round(currentMbps * 100) / 100,
            percent,
          });
        }
      }
    }

    const endTime = performance.now();
    const durationMs = Math.round((endTime - startTime) * 100) / 100;
    const durationSec = durationMs / 1000;
    const mbps = durationSec > 0
      ? Math.round(((transferredBytes * 8) / (durationSec * 1_000_000)) * 100) / 100
      : 0;

    return {
      direction: "download",
      bytesTransferred: transferredBytes,
      durationMs,
      mbps,
      timestamp: Date.now(),
      endpoint: "/api/speed/download",
      status: "success",
    };
  } catch (err: unknown) {
    const endTime = performance.now();
    const durationMs = Math.round((endTime - startTime) * 100) / 100;
    const isCancelled =
      err instanceof DOMException && err.name === "AbortError";

    return {
      direction: "download",
      bytesTransferred: transferredBytes,
      durationMs,
      mbps: 0,
      timestamp: Date.now(),
      endpoint: "/api/speed/download",
      status: isCancelled ? "cancelled" : "error",
      errorMessage: isCancelled
        ? "Measurement cancelled by user."
        : err instanceof Error
        ? err.message
        : "Download test failed",
    };
  }
}

/**
 * Runs genuine upload throughput measurement against NetRadar server endpoint.
 */
export async function runUploadSpeedTest(
  options: SpeedTestOptions = {}
): Promise<SpeedTestResult> {
  const sizeMb = Math.min(options.sizeMb ?? 2, 4); // Keep upload conservative for mobile devices
  const totalBytes = Math.floor(sizeMb * 1024 * 1024);
  const endpoint = "/api/speed/upload";

  // Create real payload buffer
  const payload = new Uint8Array(totalBytes);
  for (let i = 0; i < totalBytes; i++) {
    payload[i] = (i * 29 + 7) % 256;
  }

  const startTime = performance.now();

  try {
    if (options.onProgress) {
      options.onProgress({
        transferredBytes: 0,
        totalExpectedBytes: totalBytes,
        currentMbps: 0,
        percent: 10,
      });
    }

    const res = await fetch(endpoint, {
      method: "POST",
      body: payload,
      signal: options.abortSignal,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    const endTime = performance.now();
    const durationMs = Math.round((endTime - startTime) * 100) / 100;

    if (!res.ok) {
      throw new Error(`Upload server responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    const receivedBytes = data.receivedBytes || totalBytes;
    const durationSec = durationMs / 1000;
    const mbps = durationSec > 0
      ? Math.round(((receivedBytes * 8) / (durationSec * 1_000_000)) * 100) / 100
      : 0;

    if (options.onProgress) {
      options.onProgress({
        transferredBytes: receivedBytes,
        totalExpectedBytes: totalBytes,
        currentMbps: mbps,
        percent: 100,
      });
    }

    return {
      direction: "upload",
      bytesTransferred: receivedBytes,
      durationMs,
      mbps,
      timestamp: Date.now(),
      endpoint,
      status: "success",
    };
  } catch (err: unknown) {
    const endTime = performance.now();
    const durationMs = Math.round((endTime - startTime) * 100) / 100;
    const isCancelled =
      err instanceof DOMException && err.name === "AbortError";

    return {
      direction: "upload",
      bytesTransferred: 0,
      durationMs,
      mbps: 0,
      timestamp: Date.now(),
      endpoint,
      status: isCancelled ? "cancelled" : "error",
      errorMessage: isCancelled
        ? "Upload cancelled by user."
        : err instanceof Error
        ? err.message
        : "Upload test failed",
    };
  }
}
