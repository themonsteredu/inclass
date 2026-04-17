import { NextRequest, NextResponse } from "next/server";
import { createReadStream, statSync } from "node:fs";
import { Readable } from "node:stream";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveUploadPath } from "@/lib/paths";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const lecture = await db.lecture.findUnique({ where: { id: params.id } });
  if (!lecture) return new NextResponse("Not Found", { status: 404 });

  const filePath = resolveUploadPath(lecture.filePath);
  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    return new NextResponse("File missing", { status: 404 });
  }

  const size = stat.size;
  const range = req.headers.get("range");

  const baseHeaders: Record<string, string> = {
    "Content-Type": lecture.mimeType || "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=0, no-cache",
  };

  if (!range) {
    const stream = createReadStream(filePath);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(size) },
    });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    return new NextResponse("Invalid Range", {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    });
  }
  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : size - 1;
  if (start >= size || end >= size || start > end) {
    return new NextResponse("Range Not Satisfiable", {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    });
  }

  const stream = createReadStream(filePath, { start, end });
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
    },
  });
}
