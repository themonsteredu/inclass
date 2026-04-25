import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const u = await requireUser();
  const body = await req.json().catch(() => null);
  if (!body?.lecture_id) return NextResponse.json({ error: "no lecture_id" }, { status: 400 });
  const watched_sec = Number(body.watched_sec || 0);
  const completed = !!body.completed;
  const supa = db();
  const { data: prev } = await supa
    .from("lecture_views")
    .select("watched_sec,view_count,completed")
    .eq("user_id", u.id)
    .eq("lecture_id", body.lecture_id)
    .maybeSingle();
  const newWatched = Math.max(prev?.watched_sec ?? 0, watched_sec);
  const newCompleted = (prev?.completed ?? false) || completed;
  await supa
    .from("lecture_views")
    .upsert(
      {
        user_id: u.id,
        lecture_id: body.lecture_id,
        watched_sec: newWatched,
        view_count: prev?.view_count ?? 1,
        completed: newCompleted,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lecture_id" }
    );
  return NextResponse.json({ ok: true });
}
