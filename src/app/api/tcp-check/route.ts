import { NextRequest, NextResponse } from "next/server";
import net from "net";
import dns from "dns/promises";
import { isPrivateIpOrLocalhost } from "@/lib/validation/urlValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Controlled server-side TCP handshake probe with strict SSRF protections.
 * Browser JavaScript cannot open raw TCP sockets; this endpoint provides genuine
 * TCP SYN/ACK handshake measurements via the backend Node.js environment.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawHost = String(body.host || "").trim();
    const port = parseInt(String(body.port || ""), 10);

    if (!rawHost) {
      return NextResponse.json(
        { error: "Hostname or IP address is required." },
        { status: 400 }
      );
    }

    if (isNaN(port) || port < 1 || port > 65535) {
      return NextResponse.json(
        { error: "Port must be an integer between 1 and 65535." },
        { status: 400 }
      );
    }

    // SSRF Check 1: Hostname pattern check
    if (isPrivateIpOrLocalhost(rawHost)) {
      return NextResponse.json(
        {
          status: "forbidden",
          host: rawHost,
          port,
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
            port,
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
          port,
          durationMs: 0,
          message: `DNS Resolution failed: Unable to resolve '${rawHost}' to an IP address.`,
          isServerlessLimited: false,
        },
        { status: 200 }
      );
    }

    // Execute genuine TCP socket connection with 3500ms timeout
    const startTime = process.hrtime.bigint();
    const timeoutMs = 3500;

    const result = await new Promise<{
      status: "open" | "closed" | "timeout";
      durationMs: number;
      message: string;
    }>((resolve) => {
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
          status: "open",
          durationMs: Math.round(durationMs * 100) / 100,
          message: `TCP Handshake completed successfully in ${Math.round(durationMs * 100) / 100}ms to ${resolvedIp}:${port}`,
        });
      });

      socket.on("timeout", () => {
        if (isSettled) return;
        isSettled = true;
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;
        socket.destroy();
        resolve({
          status: "timeout",
          durationMs: Math.round(durationMs * 100) / 100,
          message: `TCP Connection timed out after ${timeoutMs}ms (SYN packet dropped or firewall filtered).`,
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
          status: "closed",
          durationMs: Math.round(durationMs * 100) / 100,
          message: `Connection refused / error (${code}): Remote host actively rejected the TCP connection.`,
        });
      });

      socket.connect(port, resolvedIp);
    });

    return NextResponse.json({
      status: result.status,
      host: rawHost,
      port,
      resolvedIp,
      durationMs: result.durationMs,
      message: result.message,
      isServerlessLimited: false,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
