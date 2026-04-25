import { db } from "@/lib/db";
import { deletePlan, regenerate, updateDay } from "../actions";

export const dynamic = "force-dynamic";

export default async function PlanDetail({ params }: { params: { id: string } }) {
  const supa = db();
  const { data: plan } = await supa
    .from("study_plans")
    .select("id,user_id,workbook_id,start_date,end_date,weekdays_mask,hours_per_day,source")
    .eq("id", params.id)
    .single();
  if (!plan) return <div>없는 플랜</div>;

  const [{ data: user }, { data: wb }, { data: days }, { data: problems }] = await Promise.all([
    supa.from("users").select("name,login_id").eq("id", plan.user_id).single(),
    supa.from("workbooks").select("title").eq("id", plan.workbook_id).single(),
    supa.from("plan_days").select("date,problem_ids").eq("plan_id", plan.id).order("date", { ascending: true }),
    supa.from("problems").select("id,number").eq("workbook_id", plan.workbook_id),
  ]);
  const numByPid = new Map<string, number>();
  for (const p of problems ?? []) numByPid.set(p.id, p.number);

  const labelDays = ["월", "화", "수", "목", "금", "토", "일"]
    .filter((_, i) => (plan.weekdays_mask & (1 << i)) !== 0)
    .join("·");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {user?.name} · {wb?.title}
      </h1>
      <div className="text-sm text-gray-600">
        {plan.start_date} ~ {plan.end_date} · 학습요일 {labelDays} · 하루 {plan.hours_per_day}h ·
        모드 <b>{plan.source === "auto" ? "자동" : "수동"}</b>
      </div>

      <div className="flex gap-2">
        <form action={regenerate}>
          <input type="hidden" name="id" value={plan.id} />
          <button className="btn-ghost" type="submit">자동 재분배</button>
        </form>
        <form action={deletePlan}>
          <input type="hidden" name="id" value={plan.id} />
          <button className="btn-danger" type="submit">플랜 삭제</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>날짜</th><th>분량(문제 번호 — 콤마 구분)</th><th>저장</th></tr>
          </thead>
          <tbody>
            {(days ?? []).map((d) => {
              const numbers = (d.problem_ids as string[])
                .map((pid) => numByPid.get(pid))
                .filter(Boolean)
                .join(", ");
              return (
                <tr key={d.date}>
                  <td className="font-mono">{d.date}</td>
                  <td>
                    <form action={updateDay} className="flex gap-2">
                      <input type="hidden" name="plan_id" value={plan.id} />
                      <input type="hidden" name="date" value={d.date} />
                      {/* admin edits the problem UUIDs directly; show numbers as hint */}
                      <input
                        name="problem_ids"
                        defaultValue={(d.problem_ids as string[]).join(", ")}
                        className="field font-mono text-xs"
                      />
                      <button className="btn-ghost" type="submit">저장</button>
                    </form>
                    <div className="text-xs text-gray-500 mt-1">번호: {numbers || "—"}</div>
                  </td>
                  <td />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
