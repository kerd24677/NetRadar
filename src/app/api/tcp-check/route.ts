import { NextRequest, NextResponse } from "next/server";
import net from "net";
import dns from "dns/promises";
import { isPrivateIpOrLocalhost } from "@/lib/validation/urlValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SinglePortResult {
  port: number;
  status: "open" | "closed" | "timeout" | "forbidden";
  durationMs: number;
  message: string;
}

async function testSinglePort(
  resolvedIp: string,
  port: number,
  timeoutMs: number = 3000
): Promise<SinglePortResult> {
  const startTime = process.hrtime.bigint();

  return new Promise<SinglePortResult>((resolve) => {
    const socket = new net.Socket();
    let isSettled = false;

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      if (isSettled) return;
      isSettled = true;
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      socket.destroy();
      resolve({
        port,
        status: "open",
        durationMs: Math.round(durationMs * 100) / 100,
        message: `TCP Handshake completed in ${Math.round(durationMs * 100) / 100}ms to ${resolvedIp}:${port}`,
      });
    });

    socket.on("timeout", () => {
      if (isSettled) return;
      isSettled = true;
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      socket.destroy();
      resolve({
        port,
        status: "timeout",
        durationMs: Math.round(durationMs * 100) / 100,
        message: `Connection timed out after ${timeoutMs}ms (SYN filtered or packet dropped).`,
      });
    });

    socket.on("error", (err: NodeJS.ErrnoException) => {
      if (isSettled) return;
      isSettled = true;
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      socket.destroy();
      const code = err.code || "ECONNREFUSED";
      resolve({
        port,
        status: "closed",
        durationMs: Math.round(durationMs * 100) / 100,
        message: `Connection rejected (${code}): Port closed or reset by host.`,
      });
    });

    socket.connect(port, resolvedIp);
  });
}

/**
 * Controlled server-side TCP handshake probe with strict SSRF protections.
 * Supports single port or multi-port array check.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawHost = String(body.host || "").trim();

    if (!rawHost) {
      return NextResponse.json(
        { error: "Hostname or IP address is required." },
        { status: 400 }
      );
    }

    // SSRF Check 1: Hostname pattern check
    if (isPrivateIpOrLocalhost(rawHost)) {
      return NextResponse.json(
        {
          status: "forbidden",
          host: rawHost,
          durationMs: 0,
          message: "SSRF Protection: Probes to localhost and private RFC-1918 subnets are prohibited.",
          isServerlessLimited: true,
        },
        { status: 403 }
      );
    }

    // SSRF Check 2: Resolve DNS to verify resolved IP is not private
    let resolvedIp = rawHost;
    try {
      const lookup = await dns.lookup(rawHost);
      resolvedIp = lookup.address;

      if (isPrivateIpOrLocalhost(resolvedIp)) {
        return NextResponse.json(
          {
            status: "forbidden",
            host: rawHost,
            durationMs: 0,
            message: `SSRF Protection: Domain resolves to protected address (${resolvedIp}). Request blocked.`,
            isServerlessLimited: true,
          },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          status: "closed",
          host: rawHost,
          durationMs: 0,
          message: `DNS Resolution failed: Unable to resolve '${rawHost}' to an IP address.`,
          isServerlessLimited: false,
        },
        { status: 200 }
      );
    }

    // Check if multi-port array was requested
    if (Array.isArray(body.ports) && body.ports.length > 0) {
      // Limit to max 12 ports for safe resource usage
      const targetPorts: number[] = body.ports
        .map((p: unknown) => parseInt(String(p), 10))
        .filter((p: number) => !isNaN(p) && p >= 1 && p <= 65535)
        .slice(0, 12);

      const scanResults = await Promise.all(
        targetPorts.map((p) => testSinglePort(resolvedIp, p, 2500))
      );

      return NextResponse.json({
        host: rawHost,
        resolvedIp,
        multiPort: true,
        results: scanResults,
      });
    }

    // Single port mode
    const port = parseInt(String(body.port || ""), 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      return NextResponse.json(
        { error: "Port must be an integer between 1 and 65535." },
        { status: 400 }
      );
    }

    const singleResult = await testSinglePort(resolvedIp, port, 3500);

    return NextResponse.json({
      status: singleResult.status,
      host: rawHost,
      port,
      resolvedIp,
      durationMs: singleResult.durationMs,
      message: singleResult.message,
      isServerlessLimited: false,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
