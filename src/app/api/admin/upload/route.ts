import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/paths";
import { LECTURE_TYPES, type LectureType } from "@/lib/constants";

export const runtime = "nodejs";

const ALLOWED_TYPES = LECTURE_TYPES;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const form = await req.formData();
  const problemId = String(form.get("problemId") ?? "");
  const type = String(form.get("type") ?? "") as (typeof ALLOWED_TYPES)[number];
  const title = String(form.get("title") ?? "");
  const duration = Number(form.get("duration") ?? 0);
  const file = form.get("file") as File | null;

  if (!problemId || !ALLOWED_TYPES.includes(type) || !title || !file) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const problem = await db.problem.findUnique({ where: { id: problemId } });
  if (!problem) return NextResponse.json({ error: "problem not found" }, { status: 404 });

  const ext = path.extname(file.name).toLowerCase() || ".mp4";
  const safeExt = /^\.(mp4|webm|mov|m4v|mkv)$/.test(ext) ? ext : ".mp4";
  const fileId = crypto.randomBytes(12).toString("hex");
  const relPath = path.posix.join("lectures", `${fileId}${safeExt}`);
  const absPath = path.join(UPLOAD_DIR, relPath);
  await mkdir(path.dirname(absPath), { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, bytes);

  const lectureType: LectureType = type;
  const lecture = await db.lecture.upsert({
    where: { problemId_type: { problemId, type: lectureType } },
    create: {
      problemId,
      type: lectureType,
      title,
      filePath: relPath,
      mimeType: file.type || "video/mp4",
      sizeBytes: bytes.byteLength,
      duration: Math.max(0, Math.floor(duration)),
    },
    update: {
      title,
      filePath: relPath,
      mimeType: file.type || "video/mp4",
      sizeBytes: bytes.byteLength,
      duration: Math.max(0, Math.floor(duration)),
    },
  });

  return NextResponse.json({ ok: true, lectureId: lecture.id });
}
