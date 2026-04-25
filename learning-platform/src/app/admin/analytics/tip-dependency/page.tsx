import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Tip dependency report — definitions:
 *  (a) Click rate: among problems with at least one event from the student,
 *      what fraction had at least one `tip_clicked` event.
 *  (c) Repeat rate: average view_count for tip-kind lectures.
 */
export default async function TipDependencyPage() {
  const supa = db();
  const { data: students } = await supa
    .from("users")
    .select("id,login_id,name")
    .eq("role", "student")
    .order("name", { ascending: true });
  const ids = (students ?? []).map((s) => s.id);

  const { data: events } = ids.length
    ? await supa
        .from("problem_events")
        .select("user_id,problem_id,kind")
        .in("user_id", ids)
    : { data: [] as any[] };

  // (a) per-user: problems_with_any_event vs problems_with_tip_click
  const seenProblems = new Map<string, Set<string>>();
  const tipProblems = new Map<string, Set<string>>();
  for (const e of events ?? []) {
    if (!["tip_clicked", "concept_clicked", "type_clicked"].includes(e.kind)) continue;
    const sP = seenProblems.get(e.user_id) || new Set<string>();
    sP.add(e.problem_id);
    seenProblems.set(e.user_id, sP);
    if (e.kind === "tip_clicked") {
      const tP = tipProblems.get(e.user_id) || new Set<string>();
      tP.add(e.problem_id);
      tipProblems.set(e.user_id, tP);
    }
  }

  // (c) per-user: avg view_count for tip-kind lectures
  const { data: tipLectures } = await supa.from("lectures").select("id").eq("kind", "tip");
  const tipIds = (tipLectures ?? []).map((l) => l.id);
  const { data: views } = ids.length && tipIds.length
    ? await supa
        .from("lecture_views")
        .select("user_id,lecture_id,view_count")
        .in("user_id", ids)
        .in("lecture_id", tipIds)
    : { data: [] as any[] };
  const tipViewsByUser = new Map<string, number[]>();
  for (const v of views ?? []) {
    const arr = tipViewsByUser.get(v.user_id) || [];
    arr.push(v.view_count);
    tipViewsByUser.set(v.user_id, arr);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">팁 의존도</h1>
      <p className="text-sm text-gray-500">
        (a) 학생이 본 문제 중 팁강의를 한 번이라도 연 비율, (c) 팁강의 평균 재시청 횟수.
      </p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>학생</th><th>아이디</th><th>본 문제</th><th>팁 클릭한 문제</th><th>팁 클릭률</th><th>팁 평균 재시청</th></tr>
          </thead>
          <tbody>
            {(students ?? []).map((s) => {
              const seen = seenProblems.get(s.id)?.size ?? 0;
              const tip = tipProblems.get(s.id)?.size ?? 0;
              const rate = seen ? Math.round((tip / seen) * 100) : 0;
              const arr = tipViewsByUser.get(s.id) ?? [];
              const avg = arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
              return (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td className="font-mono">{s.login_id}</td>
                  <td>{seen}</td>
                  <td>{tip}</td>
                  <td>{rate}%</td>
                  <td>{avg.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
