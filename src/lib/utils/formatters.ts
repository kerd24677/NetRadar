/**
 * Formatting utilities for network metrics, data sizes, and timestamps.
 */

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1) return "< 1 ms";
  if (ms < 1000) return `${Math.round(ms * 10) / 10} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatSpeed(mbps: number): string {
  if (mbps < 0.1) return `${(mbps * 1000).toFixed(0)} Kbps`;
  return `${mbps.toFixed(2)} Mbps`;
}

export function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatDateFull(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}
