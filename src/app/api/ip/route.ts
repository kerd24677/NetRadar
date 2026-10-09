import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Returns genuine client connection headers, remote IP, and user-agent details.
 */
export async function GET(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const clientIp = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1");

  const ipVersion = clientIp.includes(":") ? "IPv6" : clientIp.includes(".") ? "IPv4" : "Unknown";
  const userAgent = request.headers.get("user-agent") || "Unknown";
  const acceptLanguage = request.headers.get("accept-language") || "";
  const host = request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || "http";

  return NextResponse.json({
    ip: clientIp,
    version: ipVersion,
    userAgent,
    language: acceptLanguage.split(",")[0] || "en",
    host,
    protocol: proto,
    headers: {
      "cf-ray": request.headers.get("cf-ray") || undefined,
      "cf-ipcountry": request.headers.get("cf-ipcountry") || undefined,
      "x-vercel-id": request.headers.get("x-vercel-id") || undefined,
      "x-vercel-ip-country": request.headers.get("x-vercel-ip-country") || undefined,
      "x-vercel-ip-city": request.headers.get("x-vercel-ip-city") || undefined,
    },
  });
}
