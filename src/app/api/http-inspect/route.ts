import { NextRequest, NextResponse } from "next/server";
import { validateAndNormalizeUrl, isPrivateIpOrLocalhost } from "@/lib/validation/urlValidation";
import dns from "dns/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUrl = String(body.url || "").trim();

    const val = validateAndNormalizeUrl(rawUrl);
    if (!val.isValid) {
      return NextResponse.json(
        { error: val.error || "Invalid URL" },
        { status: 400 }
      );
    }

    if (val.isPrivateOrLocal || isPrivateIpOrLocalhost(val.hostname)) {
      return NextResponse.json(
        { error: "SSRF Protection: Probes to private/internal networks are prohibited." },
        { status: 403 }
      );
    }

    // Pre-resolve DNS to check for internal IP
    try {
      const lookup = await dns.lookup(val.hostname);
      if (isPrivateIpOrLocalhost(lookup.address)) {
        return NextResponse.json(
          { error: `SSRF Protection: Resolved IP (${lookup.address}) is private.` },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: `DNS resolution failed for hostname '${val.hostname}'` },
        { status: 400 }
      );
    }

    const startTime = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(val.normalizedUrl, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "NetRadar/1.0 (Network Diagnostics Bot; +https://netradar.local)",
      },
      cache: "no-store",
    });

    const endTime = performance.now();
    clearTimeout(timeout);
    const durationMs = Math.round((endTime - startTime) * 100) / 100;

    // Extract headers
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Security Headers analysis
    const hasHsts = Boolean(headers["strict-transport-security"]);
    const hasCsp = Boolean(headers["content-security-policy"]);
    const hasXfo = Boolean(headers["x-frame-options"]);
    const hasXcto = Boolean(headers["x-content-type-options"]);
    const hasReferrer = Boolean(headers["referrer-policy"]);
    const hasPermissions = Boolean(headers["permissions-policy"]);

    let securityScore = 0;
    if (hasHsts) securityScore += 30;
    if (hasCsp) securityScore += 25;
    if (hasXfo) securityScore += 15;
    if (hasXcto) securityScore += 10;
    if (hasReferrer) securityScore += 10;
    if (hasPermissions) securityScore += 10;

    const securityGrade =
      securityScore >= 80 ? "A" : securityScore >= 60 ? "B" : securityScore >= 40 ? "C" : "D";

    return NextResponse.json({
      url: val.normalizedUrl,
      hostname: val.hostname,
      status: res.status,
      statusText: res.statusText,
      durationMs,
      httpVersion: res.headers.get("alt-svc")?.includes("h3") ? "HTTP/3 capable" : "HTTP/2 / HTTP/1.1",
      headers,
      security: {
        score: securityScore,
        grade: securityGrade,
        hasHsts,
        hasCsp,
        hasXfo,
        hasXcto,
        hasReferrer,
        hasPermissions,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
