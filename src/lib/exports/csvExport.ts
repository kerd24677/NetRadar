import { HistoryItem } from "@/types/history";

/**
 * Escapes fields for standard RFC 4180 CSV output.
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Strips potentially sensitive query parameters (tokens, keys, passwords) from URLs for safe export.
 */
function sanitizeTargetForExport(target: string): string {
  try {
    if (target.startsWith("http://") || target.startsWith("https://")) {
      const url = new URL(target);
      // Remove any sensitive search params
      const sensitiveKeys = ["token", "key", "secret", "auth", "password", "api_key", "bearer"];
      for (const k of Array.from(url.searchParams.keys())) {
        if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
          url.searchParams.set(k, "REDACTED");
        }
      }
      return url.toString();
    }
  } catch {
    // If not a valid URL, return as is
  }
  return target;
}

export function generateHistoryCsv(items: HistoryItem[]): string {
  const headers = [
    "ID",
    "Timestamp_ISO",
    "Timestamp_Epoch",
    "Category",
    "Target",
    "Duration_ms",
    "Status",
    "Summary",
    "Error_Details",
  ];

  const rows = items.map((item) => {
    return [
      escapeCsvCell(item.id),
      escapeCsvCell(new Date(item.startTime).toISOString()),
      escapeCsvCell(item.startTime),
      escapeCsvCell(item.category),
      escapeCsvCell(sanitizeTargetForExport(item.target)),
      escapeCsvCell(item.durationMs),
      escapeCsvCell(item.status),
      escapeCsvCell(item.summary),
      escapeCsvCell(item.errorMessage || ""),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
