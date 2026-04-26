import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchVideoInfo, parseVimeoId } from "@/lib/vimeo";

/** Register or replace a lecture by Vimeo video id (or full vimeo.com URL).
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

  const cleanId = parseVimeoId(String(video_id));
  if (!cleanId) {
    return NextResponse.json(
      { error: "Vimeo 영상 ID 또는 URL 형식이 잘못됐습니다." },
      { status: 400 }
    );
  }

  // Verify the video exists on Vimeo and pull the duration.
  let duration_sec = 0;
  try {
    const info = await fetchVideoInfo(cleanId);
    if (!info) {
      return NextResponse.json(
        { error: "이 ID의 영상을 Vimeo 계정에서 찾을 수 없습니다. ID와 업로드 상태를 확인하세요." },
        { status: 400 }
      );
    }
    duration_sec = Math.floor(info.duration || 0);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Vimeo 조회 실패: " + (e?.message ?? "알 수 없음") },
      { status: 500 }
    );
  }

  const { data, error } = await db()
    .from("lectures")
    .upsert(
      { problem_id, kind, title, vimeo_video_id: cleanId, duration_sec },
      { onConflict: "problem_id,kind" }
    )
    .select("id,vimeo_video_id,duration_sec")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
