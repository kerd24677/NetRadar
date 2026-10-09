export type DiagnosticType = "http" | "dns" | "speed" | "tcp" | "traceroute";

export interface HttpDiagnosticResult {
  url: string;
  normalizedUrl: string;
  durationMs: number;
  status: "success" | "error" | "opaque";
  httpStatus?: number;
  statusText?: string;
  timestamp: number;
  errorType?: "DNS_OR_NETWORK" | "CORS_BLOCKED" | "TIMEOUT" | "MIXED_CONTENT" | "INVALID_URL" | "HTTP_ERROR" | "UNKNOWN";
  errorMessage?: string;
  isOpaqueResponse?: boolean; // When browser mode: 'no-cors' succeeds without exposing response details due to CORS
  protocol?: string;
  timingDetails?: {
    startTime: number;
    endTime: number;
  };
}

export interface SpeedTestResult {
  direction: "download" | "upload";
  bytesTransferred: number;
  durationMs: number;
  mbps: number;
  timestamp: number;
  endpoint: string;
  status: "success" | "error" | "cancelled";
  errorMessage?: string;
}

export interface TcpCheckResult {
  host: string;
  port: number;
  durationMs: number;
  status: "open" | "closed" | "timeout" | "forbidden" | "unsupported";
  timestamp: number;
  message: string;
  isServerlessLimited: boolean;
}

export interface CapabilityExplanation {
  feature: string;
  browserSupported: boolean;
  serverlessSupported: boolean;
  nativeReason: string;
  netRadarSolution: string;
}
