import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const u = await requireUser();
  const { problem_id, done } = await req.json();
  if (!problem_id) return NextResponse.json({ error: "no problem_id" }, { status: 400 });
  const supa = db();
  if (done) {
    await supa
      .from("problem_completions")
      .upsert({ user_id: u.id, problem_id }, { onConflict: "user_id,problem_id" });
    await supa.from("problem_events").insert({ user_id: u.id, problem_id, kind: "marked_done" });
  } else {
    await supa.from("problem_completions").delete().eq("user_id", u.id).eq("problem_id", problem_id);
  }
  return NextResponse.json({ ok: true });
}
