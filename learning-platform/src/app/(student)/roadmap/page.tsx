import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const u = await requireUser();
  const supa = db();
  const { data: road } = await supa
    .from("roadmaps")
    .select("id,start_date,end_date")
    .eq("user_id", u.id)
    .maybeSingle();
  if (!road) {
    return (
      <div className="card p-6 text-gray-500">아직 로드맵이 설정되지 않았어요. 학원에 문의해 주세요.</div>
    );
  }
  const { data: items } = await supa
    .from("roadmap_items")
    .select("id,workbook_id,target_start,target_end,position")
    .eq("roadmap_id", road.id)
    .order("position", { ascending: true });
  const { data: wbs } = await supa.from("workbooks").select("id,title");
  const wbMap = new Map<string, string>();
  for (const w of wbs ?? []) wbMap.set(w.id, w.title);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">2년 로드맵</h1>
      <p className="text-sm text-gray-500">{road.start_date} ~ {road.end_date}</p>
      <div className="card divide-y">
        {(items ?? []).map((it) => (
          <div key={it.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">{it.position + 1}단계</div>
              <div className="font-medium">{wbMap.get(it.workbook_id) ?? "?"}</div>
            </div>
            <div className="text-sm text-gray-600">
              {it.target_start} ~ {it.target_end}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
