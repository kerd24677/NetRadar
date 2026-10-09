import { TcpCheckResult } from "@/types/diagnostics";
import { validateHostname, validatePort } from "../validation/urlValidation";

export interface TcpProbeOptions {
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

/**
 * Invokes the NetRadar controlled backend TCP diagnostic endpoint.
 * Accurately communicates browser vs backend roles and reports true TCP handshake timing.
 */
export async function probeTcpPort(
  host: string,
  port: number | string,
  options: TcpProbeOptions = {}
): Promise<TcpCheckResult> {
  const hostVal = validateHostname(host);
  if (!hostVal.isValid) {
    return {
      host,
      port: Number(port) || 0,
      durationMs: 0,
      status: "unsupported",
      timestamp: Date.now(),
      message: hostVal.error || "Invalid host format",
      isServerlessLimited: false,
    };
  }

  const portVal = validatePort(port);
  if (!portVal.isValid) {
    return {
      host: hostVal.cleanHostname,
      port: 0,
      durationMs: 0,
      status: "unsupported",
      timestamp: Date.now(),
      message: portVal.error || "Invalid port number",
      isServerlessLimited: false,
    };
  }

  const startTime = performance.now();

  try {
    const res = await fetch("/api/tcp-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host: hostVal.cleanHostname, port: portVal.port }),
      signal: options.abortSignal,
    });

    const data = await res.json();
    const durationMs = data.durationMs || Math.round((performance.now() - startTime) * 100) / 100;

    if (!res.ok) {
      return {
        host: hostVal.cleanHostname,
        port: portVal.port,
        durationMs,
        status: data.status === "forbidden" ? "forbidden" : "closed",
        timestamp: Date.now(),
        message: data.message || data.error || `Server returned HTTP ${res.status}`,
        isServerlessLimited: Boolean(data.isServerlessLimited),
      };
    }

    return {
      host: hostVal.cleanHostname,
      port: portVal.port,
      durationMs,
      status: data.status,
      timestamp: Date.now(),
      message: data.message,
      isServerlessLimited: Boolean(data.isServerlessLimited),
    };
  } catch (err: unknown) {
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const isAbort = err instanceof DOMException && err.name === "AbortError";

    return {
      host: hostVal.cleanHostname,
      port: portVal.port,
      durationMs,
      status: isAbort ? "timeout" : "closed",
      timestamp: Date.now(),
      message: isAbort
        ? "TCP diagnostic timed out waiting for backend response."
        : "Failed to connect to NetRadar backend diagnostic service.",
      isServerlessLimited: false,
    };
  }
}
