import { describe, it, expect } from "vitest";
import {
  validateAndNormalizeUrl,
  validateHostname,
  validatePort,
  isPrivateIpOrLocalhost,
} from "./urlValidation";

describe("urlValidation", () => {
  describe("validateAndNormalizeUrl", () => {
    it("should accept valid https URLs", () => {
      const res = validateAndNormalizeUrl("https://cloudflare.com");
      expect(res.isValid).toBe(true);
      expect(res.hostname).toBe("cloudflare.com");
      expect(res.protocol).toBe("https:");
    });

    it("should auto-prepend https:// if protocol is omitted", () => {
      const res = validateAndNormalizeUrl("github.com/status");
      expect(res.isValid).toBe(true);
      expect(res.hostname).toBe("github.com");
      expect(res.protocol).toBe("https:");
      expect(res.normalizedUrl).toBe("https://github.com/status");
    });

    it("should reject non-HTTP protocols like ftp or javascript", () => {
      const ftpRes = validateAndNormalizeUrl("ftp://ftp.example.com");
      expect(ftpRes.isValid).toBe(false);
      expect(ftpRes.error).toContain("Only HTTP and HTTPS");

      const jsRes = validateAndNormalizeUrl("javascript:alert(1)");
      expect(jsRes.isValid).toBe(false);
    });

    it("should strip embedded basic auth credentials for safety", () => {
      const res = validateAndNormalizeUrl("https://admin:secret123@example.com/api");
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).not.toContain("admin");
      expect(res.normalizedUrl).not.toContain("secret123");
    });

    it("should identify private and loopback addresses", () => {
      const localRes = validateAndNormalizeUrl("http://localhost:3000");
      expect(localRes.isValid).toBe(true);
      expect(localRes.isPrivateOrLocal).toBe(true);

      const privateIp = validateAndNormalizeUrl("http://192.168.1.1");
      expect(privateIp.isValid).toBe(true);
      expect(privateIp.isPrivateOrLocal).toBe(true);

      const publicIp = validateAndNormalizeUrl("https://1.1.1.1");
      expect(publicIp.isValid).toBe(true);
      expect(publicIp.isPrivateOrLocal).toBe(false);
    });
  });

  describe("isPrivateIpOrLocalhost", () => {
    it("should identify 127.0.0.1, localhost, and RFC1918 ranges", () => {
      expect(isPrivateIpOrLocalhost("localhost")).toBe(true);
      expect(isPrivateIpOrLocalhost("127.0.0.1")).toBe(true);
      expect(isPrivateIpOrLocalhost("10.0.0.5")).toBe(true);
      expect(isPrivateIpOrLocalhost("192.168.0.100")).toBe(true);
      expect(isPrivateIpOrLocalhost("172.16.10.20")).toBe(true);
      expect(isPrivateIpOrLocalhost("app.local")).toBe(true);
      expect(isPrivateIpOrLocalhost("::1")).toBe(true);
    });

    it("should recognize public domains as non-private", () => {
      expect(isPrivateIpOrLocalhost("8.8.8.8")).toBe(false);
      expect(isPrivateIpOrLocalhost("1.1.1.1")).toBe(false);
      expect(isPrivateIpOrLocalhost("google.com")).toBe(false);
    });
  });

  describe("validateHostname", () => {
    it("should extract and sanitize hostname from full URLs", () => {
      const res = validateHostname("https://sub.domain.com:8443/test/path");
      expect(res.isValid).toBe(true);
      expect(res.cleanHostname).toBe("sub.domain.com");
    });

    it("should reject empty inputs", () => {
      const res = validateHostname("   ");
      expect(res.isValid).toBe(false);
    });
  });

  describe("validatePort", () => {
    it("should validate legitimate TCP ports", () => {
      expect(validatePort(80).isValid).toBe(true);
      expect(validatePort("443").isValid).toBe(true);
      expect(validatePort(65535).isValid).toBe(true);
    });

    it("should reject invalid ports", () => {
      expect(validatePort(0).isValid).toBe(false);
      expect(validatePort(70000).isValid).toBe(false);
      expect(validatePort("invalid").isValid).toBe(false);
    });
  });
});
