import { HttpDiagnosticResult } from "@/types/diagnostics";
import { validateAndNormalizeUrl } from "../validation/urlValidation";

export interface HttpDiagnosticOptions {
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

/**
 * Measures real HTTP/HTTPS response duration using browser fetch & performance.now().
 * Accurately analyzes CORS, mixed-content, timeout, and connection errors.
 * Note: Browser JavaScript measures HTTP/HTTPS application-layer round trip, NOT raw ICMP ping.
 */
export async function measureHttpLatency(
  target: string,
  options: HttpDiagnosticOptions = {}
): Promise<HttpDiagnosticResult> {
  const timeoutMs = options.timeoutMs ?? 5000;
  const validation = validateAndNormalizeUrl(target);

  if (!validation.isValid) {
    return {
      url: target,
      normalizedUrl: target,
      durationMs: 0,
      status: "error",
      timestamp: Date.now(),
      errorType: "INVALID_URL",
      errorMessage: validation.error || "Invalid URL or domain format.",
    };
  }

  const normalizedUrl = validation.normalizedUrl;

  // Check for Mixed-Content restriction: PWA is running on https:// but user entered http://
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    validation.protocol === "http:" &&
    !validation.isPrivateOrLocal
  ) {
    return {
      url: target,
      normalizedUrl,
      durationMs: 0,
      status: "error",
      timestamp: Date.now(),
      errorType: "MIXED_CONTENT",
      errorMessage:
        "Mixed Content Block: Browser security blocks plain HTTP requests from a secure HTTPS origin. Please use https:// for public endpoints.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Link external abort signal if provided
  if (options.abortSignal) {
    options.abortSignal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      controller.abort();
    });
  }

  const startTime = performance.now();

  try {
    // Attempt 1: Standard fetch (with cache busting to test live network path)
    const urlObj = new URL(normalizedUrl);
    urlObj.searchParams.set("_netradar_t", Date.now().toString());

    let res: Response;
    try {
      res = await fetch(urlObj.toString(), {
        method: "HEAD",
        mode: "cors",
        signal: controller.signal,
        cache: "no-store",
      });
    } catch {
      // If HEAD fails or CORS rejected, try GET with no-cors to measure real HTTP roundtrip
      res = await fetch(urlObj.toString(), {
        method: "GET",
        mode: "no-cors",
        signal: controller.signal,
        cache: "no-store",
      });
    }

    const endTime = performance.now();
    clearTimeout(timeoutId);
    const durationMs = Math.round((endTime - startTime) * 100) / 100;

    // Check if response is opaque (standard browser CORS security isolation)
    if (res.type === "opaque" || res.status === 0) {
      return {
        url: target,
        normalizedUrl,
        durationMs,
        status: "opaque",
        httpStatus: 0,
        statusText: "Opaque (CORS-restricted)",
        isOpaqueResponse: true,
        timestamp: Date.now(),
        protocol: validation.protocol,
        timingDetails: { startTime, endTime },
        errorMessage:
          "HTTP round-trip completed successfully. The remote server does not return CORS headers for cross-origin reads, so the browser isolates response headers, but network timing is genuine.",
      };
    }

    return {
      url: target,
      normalizedUrl,
      durationMs,
      status: res.ok ? "success" : "error",
      httpStatus: res.status,
      statusText: res.statusText || (res.ok ? "OK" : `HTTP ${res.status}`),
      isOpaqueResponse: false,
      timestamp: Date.now(),
      protocol: validation.protocol,
      timingDetails: { startTime, endTime },
    };
  } catch (err: unknown) {
    const endTime = performance.now();
    clearTimeout(timeoutId);
    const durationMs = Math.round((endTime - startTime) * 100) / 100;

    const isAbort =
      err instanceof DOMException && err.name === "AbortError";

    if (isAbort) {
      return {
        url: target,
        normalizedUrl,
        durationMs,
        status: "error",
        timestamp: Date.now(),
        errorType: "TIMEOUT",
        errorMessage: `Request timed out after ${timeoutMs}ms without receiving a response.`,
      };
    }

    // Network / DNS / TLS / Mixed Content error
    const errMessage = err instanceof Error ? err.message : String(err);

    return {
      url: target,
      normalizedUrl,
      durationMs,
      status: "error",
      timestamp: Date.now(),
      errorType: "DNS_OR_NETWORK",
      errorMessage: `Network error (${errMessage}). This typically indicates unreachable host, DNS resolution failure, rejected TLS handshake, or network disconnection.`,
    };
  }
}
