import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QuickDiagnosticsCard } from "./QuickDiagnosticsCard";

// Mock the diagnostics libraries
vi.mock("@/lib/diagnostics/httpPing", () => ({
  measureHttpLatency: vi.fn().mockResolvedValue({
    url: "cloudflare.com",
    normalizedUrl: "https://cloudflare.com/",
    durationMs: 42.5,
    status: "success",
    httpStatus: 200,
    statusText: "OK",
    timestamp: Date.now(),
  }),
}));

vi.mock("@/lib/diagnostics/dnsOverHttps", () => ({
  queryDnsOverHttps: vi.fn().mockResolvedValue({
    resolver: "https://cloudflare-dns.com/dns-query",
    domain: "cloudflare.com",
    recordType: "A",
    durationMs: 28.1,
    status: "success",
    statusCode: 0,
    statusText: "NOERROR (Success)",
    answers: [{ name: "cloudflare.com", type: 1, TTL: 300, data: "104.16.132.229" }],
    timestamp: Date.now(),
  }),
}));

vi.mock("@/lib/storage/historyStore", () => ({
  saveHistoryItem: vi.fn().mockResolvedValue(undefined),
}));

describe("QuickDiagnosticsCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render probe input and trigger button", () => {
    render(<QuickDiagnosticsCard />);
    expect(screen.getByPlaceholderText(/e.g. cloudflare.com/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /probe/i })).toBeInTheDocument();
  });

  it("should execute probe and display live results upon clicking probe", async () => {
    const onComplete = vi.fn();
    render(<QuickDiagnosticsCard onTestComplete={onComplete} />);

    const probeBtn = screen.getByRole("button", { name: /probe/i });
    fireEvent.click(probeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Measurement Report|Measured Live/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/HTTP Response Time/i)).toBeInTheDocument();
    expect(screen.getByText(/DNS Resolution/i)).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalled();
  });
});
