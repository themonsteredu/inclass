import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { previewUrl } from "@/lib/drive";
import LecturePlayer from "./LecturePlayer";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = { tip: "팁", concept: "개념", type: "유형" };

export default async function LecturePage({ params }: { params: { id: string } }) {
  const u = await requireUser();
  const supa = db();
  const { data: lec } = await supa
    .from("lectures")
    .select("id,kind,title,duration_sec,drive_file_id,problem_id")
    .eq("id", params.id)
    .single();
  if (!lec) return <div>없는 강의</div>;

  // Log click event for tip-dependency analytics — once per page visit.
  await supa.from("problem_events").insert({
    user_id: u.id,
    problem_id: lec.problem_id,
    kind: `${lec.kind}_clicked` as any,
  });

  const { data: prev } = await supa
    .from("lecture_views")
    .select("watched_sec,view_count,completed")
    .eq("user_id", u.id)
    .eq("lecture_id", lec.id)
    .maybeSingle();

  // Increment view count on each open.
  await supa
    .from("lecture_views")
    .upsert(
      {
        user_id: u.id,
        lecture_id: lec.id,
        watched_sec: prev?.watched_sec ?? 0,
        view_count: (prev?.view_count ?? 0) + 1,
        completed: prev?.completed ?? false,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lecture_id" }
    );

  const url = previewUrl(lec.drive_file_id);

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-500">
        {KIND_LABEL[lec.kind]}강의 · {Math.floor(lec.duration_sec / 60)}분
      </div>
      <h1 className="text-2xl font-semibold">{lec.title || `${KIND_LABEL[lec.kind]}강의`}</h1>
      <LecturePlayer src={url} lectureId={lec.id} durationSec={lec.duration_sec} />
      <p className="text-xs text-gray-500">
        영상이 끝까지 재생되면 자동으로 시청완료로 기록됩니다.
      </p>
    </div>
  );
}
