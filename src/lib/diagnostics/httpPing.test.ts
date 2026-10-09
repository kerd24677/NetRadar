import { describe, it, expect, vi, beforeEach } from "vitest";
import { measureHttpLatency } from "./httpPing";

describe("measureHttpLatency", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fail cleanly on invalid URL formats without throwing unhandled exceptions", async () => {
    const res = await measureHttpLatency("not an address @#$");
    expect(res.status).toBe("error");
    expect(res.errorType).toBe("INVALID_URL");
    expect(res.errorMessage).toBeDefined();
  });

  it("should measure real response duration and status on successful fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      type: "basic",
    } as Response);

    const res = await measureHttpLatency("https://example.com");
    expect(res.status).toBe("success");
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
    expect(res.normalizedUrl).toBe("https://example.com/");
  });

  it("should handle CORS opaque responses gracefully", async () => {
    // When HEAD fails with CORS, fallback GET returns opaque response
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new TypeError("CORS blocked"))
      .mockResolvedValueOnce({
        ok: false,
        status: 0,
        statusText: "",
        type: "opaque",
      } as Response);

    const res = await measureHttpLatency("https://example.com");
    expect(res.status).toBe("opaque");
    expect(res.isOpaqueResponse).toBe(true);
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should handle timeout correctly", async () => {
    const abortErr = new DOMException("The operation was aborted", "AbortError");
    global.fetch = vi.fn().mockRejectedValue(abortErr);

    const res = await measureHttpLatency("https://timeout-test.org", { timeoutMs: 100 });
    expect(res.status).toBe("error");
    expect(res.errorType).toBe("TIMEOUT");
    expect(res.errorMessage).toContain("Request timed out");
  });
});
