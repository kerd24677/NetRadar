import { describe, it, expect, vi, beforeEach } from "vitest";
import { queryDnsOverHttps } from "./dnsOverHttps";

describe("queryDnsOverHttps", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should reject invalid domain syntax", async () => {
    const res = await queryDnsOverHttps("invalid..domain..@@");
    expect(res.status).toBe("error");
    expect(res.statusCode).toBe(-1);
    expect(res.answers).toHaveLength(0);
  });

  it("should parse authentic DNS response with answers", async () => {
    const mockDohResponse = {
      Status: 0,
      TC: false,
      RD: true,
      RA: true,
      AD: true,
      CD: false,
      Question: [{ name: "google.com.", type: 1 }],
      Answer: [
        { name: "google.com.", type: 1, TTL: 300, data: "142.250.190.46" },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDohResponse,
    } as Response);

    const res = await queryDnsOverHttps("google.com", "A");
    expect(res.status).toBe("success");
    expect(res.statusCode).toBe(0);
    expect(res.dnssecValidated).toBe(true);
    expect(res.answers).toHaveLength(1);
    expect(res.answers[0].data).toBe("142.250.190.46");
    expect(res.answers[0].typeName).toBe("A");
  });

  it("should handle NXDOMAIN (Status: 3) accurately without faking records", async () => {
    const mockNxDomain = {
      Status: 3,
      TC: false,
      RD: true,
      RA: true,
      AD: false,
      CD: false,
      Question: [{ name: "nonexistent-domain-12345xyz.org.", type: 1 }],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockNxDomain,
    } as Response);

    const res = await queryDnsOverHttps("nonexistent-domain-12345xyz.org", "A");
    expect(res.status).toBe("error");
    expect(res.statusCode).toBe(3);
    expect(res.statusText).toContain("NXDOMAIN");
    expect(res.answers).toHaveLength(0);
    expect(res.errorMessage).toContain("error code 3");
  });
});
