import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Route handler for genuine throughput upload testing.
 * Reads raw stream data transferred from client and measures received bytes.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = request.body;
    if (!body) {
      return NextResponse.json(
        { error: "No payload provided for upload measurement" },
        { status: 400 }
      );
    }

    const reader = body.getReader();
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      status: "ok",
      receivedBytes: totalBytes,
      serverDurationMs: durationMs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload processing failed";
    return NextResponse.json(
      { error: message, receivedBytes: 0 },
      { status: 500 }
    );
  }
}
