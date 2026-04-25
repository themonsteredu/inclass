import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AnalyticsHome() {
  const supa = db();
  const { data: students } = await supa
    .from("users")
    .select("id,login_id,name,status")
    .eq("role", "student")
    .order("name", { ascending: true });

  // Per-student progress: completed problems / problems planned in their plan_days
  const ids = (students ?? []).map((s) => s.id);
  const { data: plans } = ids.length
    ? await supa.from("study_plans").select("id,user_id").in("user_id", ids)
    : { data: [] as any[] };
  const planByUser = new Map<string, string[]>();
  for (const p of plans ?? []) {
    const arr = planByUser.get(p.user_id) || [];
    arr.push(p.id);
    planByUser.set(p.user_id, arr);
  }
  const planIds = (plans ?? []).map((p) => p.id);
  const { data: days } = planIds.length
    ? await supa.from("plan_days").select("plan_id,problem_ids").in("plan_id", planIds)
    : { data: [] as any[] };
  const planToPlanned = new Map<string, Set<string>>();
  for (const d of days ?? []) {
    const set = planToPlanned.get(d.plan_id) || new Set<string>();
    for (const pid of d.problem_ids as string[]) set.add(pid);
    planToPlanned.set(d.plan_id, set);
  }
  const { data: completions } = ids.length
    ? await supa.from("problem_completions").select("user_id,problem_id").in("user_id", ids)
    : { data: [] as any[] };
  const doneByUser = new Map<string, Set<string>>();
  for (const c of completions ?? []) {
    const s = doneByUser.get(c.user_id) || new Set<string>();
    s.add(c.problem_id);
    doneByUser.set(c.user_id, s);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">분석</h1>
        <Link className="btn-ghost" href="/admin/analytics/tip-dependency">팁 의존도</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>학생</th><th>아이디</th><th>상태</th><th>계획 문제 수</th><th>완료</th><th>진척률</th></tr>
          </thead>
          <tbody>
            {(students ?? []).map((s) => {
              const ps = planByUser.get(s.id) ?? [];
              const planned = new Set<string>();
              for (const pid of ps) {
                for (const pp of planToPlanned.get(pid) ?? new Set<string>()) planned.add(pp);
              }
              const done = doneByUser.get(s.id) ?? new Set<string>();
              const overlap = Array.from(done).filter((p) => planned.has(p)).length;
              const pct = planned.size ? Math.round((overlap / planned.size) * 100) : 0;
              return (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td className="font-mono">{s.login_id}</td>
                  <td>{s.status === "active" ? "활성" : "휴면"}</td>
                  <td>{planned.size}</td>
                  <td>{overlap}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded bg-gray-200 overflow-hidden">
                        <div className="h-full bg-brand-600" style={{ width: pct + "%" }} />
                      </div>
                      <span className="text-sm">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
