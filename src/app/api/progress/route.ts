import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessLecture } from "@/lib/enrollments";

const Body = z.object({
  lectureId: z.string().min(1),
  deltaSeconds: z.number().int().min(0).max(120),
  position: z.number().int().min(0),
  completed: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }
  const { lectureId, deltaSeconds, position, completed } = parsed.data;

  const lecture = await db.lecture.findUnique({ where: { id: lectureId } });
  if (!lecture) return new NextResponse("Not Found", { status: 404 });

  const userId = session.user.id;
  if (!(await canAccessLecture(userId, session.user.role, lectureId))) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const existing = await db.watchLog.findUnique({
    where: { userId_lectureId: { userId, lectureId } },
  });

  const nextCompleted =
    completed === true ||
    existing?.completed === true ||
    (lecture.duration > 0 &&
      (existing?.watchedSeconds ?? 0) + deltaSeconds >=
        Math.floor(lecture.duration * 0.9));

  const log = await db.watchLog.upsert({
    where: { userId_lectureId: { userId, lectureId } },
    create: {
      userId,
      lectureId,
      watchedSeconds: deltaSeconds,
      lastPosition: position,
      completed: nextCompleted,
    },
    update: {
      watchedSeconds: { increment: deltaSeconds },
      lastPosition: position,
      completed: nextCompleted,
    },
  });

  return NextResponse.json({
    ok: true,
    watchedSeconds: log.watchedSeconds,
    completed: log.completed,
  });
}
