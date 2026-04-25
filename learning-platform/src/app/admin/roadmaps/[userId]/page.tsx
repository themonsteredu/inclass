import { db } from "@/lib/db";
import { addItem, deleteItem, ensureRoadmap } from "./actions";

export const dynamic = "force-dynamic";

export default async function RoadmapEditPage({ params }: { params: { userId: string } }) {
  const supa = db();
  const { data: user } = await supa
    .from("users")
    .select("id,name,login_id")
    .eq("id", params.userId)
    .single();
  if (!user) return <div>없는 학생</div>;

  const { data: road } = await supa
    .from("roadmaps")
    .select("id,start_date,end_date")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: items } = road
    ? await supa
        .from("roadmap_items")
        .select("id,workbook_id,target_start,target_end,position")
        .eq("roadmap_id", road.id)
        .order("position", { ascending: true })
    : { data: [] as any[] };

  const { data: workbooks } = await supa
    .from("workbooks")
    .select("id,title")
    .order("title", { ascending: true });
  const wbMap = new Map<string, string>();
  for (const w of workbooks ?? []) wbMap.set(w.id, w.title);

  const today = new Date();
  const defStart = road?.start_date ?? today.toISOString().slice(0, 10);
  const defEnd =
    road?.end_date ??
    new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{user.name} 로드맵</h1>
      <p className="text-sm text-gray-500">아이디: <span className="font-mono">{user.login_id}</span></p>

      <form action={ensureRoadmap} className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input type="hidden" name="user_id" value={user.id} />
        <div>
          <label className="label">시작일</label>
          <input type="date" name="start_date" defaultValue={defStart} className="field" required />
        </div>
        <div>
          <label className="label">종료일 (보통 2년 뒤)</label>
          <input type="date" name="end_date" defaultValue={defEnd} className="field" required />
        </div>
        <div className="flex items-end md:col-span-2">
          <button className="btn-primary w-full" type="submit">로드맵 저장</button>
        </div>
      </form>

      {road && (
        <>
          <form action={addItem} className="card p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <input type="hidden" name="user_id" value={user.id} />
            <input type="hidden" name="roadmap_id" value={road.id} />
            <div>
              <label className="label">문제집</label>
              <select name="workbook_id" className="field" required>
                <option value="">선택</option>
                {(workbooks ?? []).map((w) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">목표 시작</label>
              <input type="date" name="target_start" className="field" required />
            </div>
            <div>
              <label className="label">목표 종료</label>
              <input type="date" name="target_end" className="field" required />
            </div>
            <div className="flex items-end md:col-span-2">
              <button className="btn-primary w-full" type="submit">로드맵 항목 추가</button>
            </div>
          </form>

          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>순서</th><th>문제집</th><th>기간</th><th>관리</th></tr>
              </thead>
              <tbody>
                {(items ?? []).map((it) => (
                  <tr key={it.id}>
                    <td>{it.position + 1}</td>
                    <td>{wbMap.get(it.workbook_id) ?? "?"}</td>
                    <td>{it.target_start} ~ {it.target_end}</td>
                    <td>
                      <form action={deleteItem}>
                        <input type="hidden" name="id" value={it.id} />
                        <input type="hidden" name="user_id" value={user.id} />
                        <button className="btn-danger" type="submit">삭제</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
