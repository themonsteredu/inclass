import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtYMD } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const u = await requireUser();
  const today = fmtYMD(new Date());
  const supa = db();

  const { data: plans } = await supa
    .from("study_plans")
    .select("id,workbook_id,start_date,end_date")
    .eq("user_id", u.id);
  const planIds = (plans ?? []).map((p) => p.id);
  const { data: dayRows } = planIds.length
    ? await supa
        .from("plan_days")
        .select("plan_id,date,problem_ids")
        .in("plan_id", planIds)
        .eq("date", today)
    : { data: [] as any[] };

  const allPids = Array.from(new Set((dayRows ?? []).flatMap((r) => r.problem_ids as string[])));
  const { data: problems } = allPids.length
    ? await supa.from("problems").select("id,number,title,workbook_id").in("id", allPids)
    : { data: [] as any[] };
  const { data: workbooks } = await supa.from("workbooks").select("id,title");
  const wbMap = new Map<string, string>();
  for (const w of workbooks ?? []) wbMap.set(w.id, w.title);

  const { data: done } = allPids.length
    ? await supa
        .from("problem_completions")
        .select("problem_id")
        .eq("user_id", u.id)
        .in("problem_id", allPids)
    : { data: [] as any[] };
  const doneSet = new Set((done ?? []).map((d) => d.problem_id));

  const totalToday = allPids.length;
  const doneToday = (done ?? []).length;
  const pct = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">오늘 할 분량</h1>
        <p className="text-sm text-gray-500">{today}</p>
      </div>

      <div className="card p-4">
        <div className="text-sm text-gray-500">오늘의 진척률</div>
        <div className="flex items-center gap-3 mt-1">
          <div className="text-2xl font-semibold">{pct}%</div>
          <div className="flex-1 h-2 rounded bg-gray-200 overflow-hidden">
            <div className="h-full bg-brand-600" style={{ width: pct + "%" }} />
          </div>
          <div className="text-sm text-gray-500">{doneToday}/{totalToday}</div>
        </div>
      </div>

      <div className="space-y-3">
        {(problems ?? []).length === 0 ? (
          <div className="card p-6 text-gray-500">오늘 배정된 분량이 없습니다.</div>
        ) : (
          (problems ?? [])
            .sort((a: any, b: any) => a.number - b.number)
            .map((p: any) => (
              <div key={p.id} className="card p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">{wbMap.get(p.workbook_id)}</div>
                  <div className="font-medium">
                    {p.number}번 {p.title ? `· ${p.title}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doneSet.has(p.id) && <span className="text-green-700 text-sm">완료</span>}
                  <Link href={`/problems/${p.id}`} className="btn-primary">강의 보기</Link>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
