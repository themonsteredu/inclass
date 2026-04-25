import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchVideoInfo } from "@/lib/bunny";

/** Register or replace a lecture by Bunny video GUID.
 *  Body: { problem_id, kind, video_id, title? } */
export async function POST(req: Request) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  const { problem_id, kind, video_id } = body;
  const title: string | null = body.title ?? null;
  if (!problem_id || !["tip", "concept", "type"].includes(kind) || !video_id) {
    return NextResponse.json({ error: "잘못된 입력" }, { status: 400 });
  }

  // Verify the GUID actually exists in this Bunny library; pull the duration.
  let duration_sec = 0;
  try {
    const info = await fetchVideoInfo(String(video_id));
    if (!info) {
      return NextResponse.json(
        { error: "이 GUID는 Bunny 라이브러리에 없습니다. 라이브러리/GUID를 확인하세요." },
        { status: 400 }
      );
    }
    duration_sec = Math.floor(info.length || 0);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Bunny 조회 실패: " + (e?.message ?? "알 수 없음") },
      { status: 500 }
    );
  }

  const { data, error } = await db()
    .from("lectures")
    .upsert(
      { problem_id, kind, title, bunny_video_id: String(video_id), duration_sec },
      { onConflict: "problem_id,kind" }
    )
    .select("id,bunny_video_id,duration_sec")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
