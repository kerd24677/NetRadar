import { describe, it, expect } from "vitest";
import { generateHistoryCsv } from "./csvExport";
import { HistoryItem } from "@/types/history";

describe("csvExport", () => {
  it("should generate CSV with standard headers", () => {
    const csv = generateHistoryCsv([]);
    expect(csv).toContain("ID,Timestamp_ISO,Timestamp_Epoch,Category,Target,Duration_ms,Status,Summary,Error_Details");
  });

  it("should escape quotes and commas properly according to RFC 4180", () => {
    const item: HistoryItem = {
      id: "item_quotes",
      category: "http",
      target: "https://example.com/test",
      startTime: 1600000000000,
      endTime: 1600000000050,
      durationMs: 50.2,
      status: "success",
      summary: 'HTTP "200 OK", latency 50.2 ms',
      details: {},
    };

    const csv = generateHistoryCsv([item]);
    expect(csv).toContain('"item_quotes"');
    expect(csv).toContain('""200 OK""'); // Escaped quote inside CSV cell
  });

  it("should redact sensitive query parameters from exported targets", () => {
    const item: HistoryItem = {
      id: "item_auth",
      category: "http",
      target: "https://api.example.com/data?token=super_secret_token_123&env=prod",
      startTime: 1600000000000,
      endTime: 1600000000050,
      durationMs: 50,
      status: "success",
      summary: "API call",
      details: {},
    };

    const csv = generateHistoryCsv([item]);
    expect(csv).not.toContain("super_secret_token_123");
    expect(csv).toContain("REDACTED");
  });
});
