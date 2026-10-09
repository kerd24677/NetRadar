import { HttpDiagnosticResult, SpeedTestResult, TcpCheckResult } from "./diagnostics";
import { DnsQueryResult } from "./dns";

export type TestCategory = "http" | "dns" | "speed" | "tcp";

export interface HistoryItem {
  id: string;
  category: TestCategory;
  target: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: "success" | "warning" | "error";
  summary: string;
  details: {
    http?: HttpDiagnosticResult;
    dns?: DnsQueryResult;
    speed?: SpeedTestResult;
    tcp?: TcpCheckResult;
  };
  errorMessage?: string;
}

export interface HistoryFilter {
  category?: TestCategory | "all";
  status?: "all" | "success" | "warning" | "error";
  searchQuery?: string;
  sortBy?: "newest" | "oldest" | "duration";
}
