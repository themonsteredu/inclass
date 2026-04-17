import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LECTURE_TYPES } from "@/lib/constants";

export const runtime = "nodejs";

const Body = z.object({
  problemId: z.string().min(1),
  type: z.enum(LECTURE_TYPES),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  mimeType: z.string().default("video/mp4"),
  sizeBytes: z.number().int().min(0).default(0),
  duration: z.number().int().min(0).default(0),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }
  const { problemId, type, title, url, mimeType, sizeBytes, duration } = parsed.data;

  const problem = await db.problem.findUnique({ where: { id: problemId } });
  if (!problem) {
    return NextResponse.json({ error: "problem not found" }, { status: 404 });
  }

  const existing = await db.lecture.findUnique({
    where: { problemId_type: { problemId, type } },
  });
  if (existing && existing.filePath && existing.filePath !== url) {
    try {
      await del(existing.filePath);
    } catch {
      // blob already gone — ignore
    }
  }

  const lecture = await db.lecture.upsert({
    where: { problemId_type: { problemId, type } },
    create: {
      problemId,
      type,
      title,
      filePath: url,
      mimeType,
      sizeBytes,
      duration,
    },
    update: {
      title,
      filePath: url,
      mimeType,
      sizeBytes,
      duration,
    },
  });
  return NextResponse.json({ ok: true, lectureId: lecture.id });
}
