import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Route handler for genuine throughput download testing.
 * Streams real non-compressible binary data in chunks to the client.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestedMb = parseFloat(searchParams.get("sizeMb") || "2");
  // Clamp between 0.5 MB and 10 MB for safe serverless memory/time limits
  const sizeMb = Math.max(0.5, Math.min(requestedMb, 10));
  const totalBytes = Math.floor(sizeMb * 1024 * 1024);

  // Generate 64KB chunk buffer filled with pseudo-random bytes
  const CHUNK_SIZE = 64 * 1024;
  const chunkBuffer = new Uint8Array(CHUNK_SIZE);
  for (let i = 0; i < CHUNK_SIZE; i++) {
    chunkBuffer[i] = (i * 37 + 13) % 256;
  }

  let bytesSent = 0;

  const stream = new ReadableStream({
    pull(controller) {
      if (bytesSent >= totalBytes) {
        controller.close();
        return;
      }

      const remaining = totalBytes - bytesSent;
      const bytesToSend = Math.min(CHUNK_SIZE, remaining);

      if (bytesToSend === CHUNK_SIZE) {
        controller.enqueue(chunkBuffer);
      } else {
        controller.enqueue(chunkBuffer.subarray(0, bytesToSend));
      }

      bytesSent += bytesToSend;
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": totalBytes.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
