import Link from "next/link";
import { db } from "@/lib/db";
import { createPlan } from "./actions";
import { DEFAULT_WEEKDAYS_MASK } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const supa = db();
  const { data: plans } = await supa
    .from("study_plans")
    .select("id,user_id,workbook_id,start_date,end_date,source,weekdays_mask,hours_per_day,created_at")
    .order("created_at", { ascending: false });

  const userIds = Array.from(new Set((plans ?? []).map((p) => p.user_id)));
  const wbIds = Array.from(new Set((plans ?? []).map((p) => p.workbook_id)));
  const { data: users } = await supa.from("users").select("id,name,login_id").eq("role", "student");
  const { data: workbooks } = await supa.from("workbooks").select("id,title");
  const userMap = new Map<string, any>(users?.map((u) => [u.id, u]) ?? []);
  const wbMap = new Map<string, any>(workbooks?.map((w) => [w.id, w]) ?? []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">학습 플랜</h1>
      <p className="text-sm text-gray-500">
        문제집별 진도 계획. 일요일은 기본 제외, 요일·기간을 입력하면 시스템이 일별 분량을 자동 분배합니다.
      </p>

      <form action={createPlan} className="card p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        <div>
          <label className="label">학생</label>
          <select name="user_id" className="field" required>
            <option value="">선택</option>
            {(users ?? []).map((u: any) => (
              <option key={u.id} value={u.id}>{u.name} ({u.login_id})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">문제집</label>
          <select name="workbook_id" className="field" required>
            <option value="">선택</option>
            {(workbooks ?? []).map((w: any) => (
              <option key={w.id} value={w.id}>{w.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">시작</label>
          <input type="date" name="start_date" className="field" required />
        </div>
        <div>
          <label className="label">종료</label>
          <input type="date" name="end_date" className="field" required />
        </div>
        <div>
          <label className="label">학습 요일</label>
          <div className="flex gap-2 flex-wrap text-xs pt-1">
            {[
              { i: 0, label: "월" },
              { i: 1, label: "화" },
              { i: 2, label: "수" },
              { i: 3, label: "목" },
              { i: 4, label: "금" },
              { i: 5, label: "토" },
              { i: 6, label: "일" },
            ].map((d) => (
              <label key={d.i} className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  name="wd"
                  value={d.i}
                  defaultChecked={(DEFAULT_WEEKDAYS_MASK & (1 << d.i)) !== 0}
                />
                {d.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="label">하루 시간(시간)</label>
          <input type="number" name="hours_per_day" defaultValue="2" min="0.5" step="0.5" className="field" />
        </div>
        <div className="md:col-span-6 flex justify-end">
          <button className="btn-primary" type="submit">자동 분배 생성</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>학생</th><th>문제집</th><th>기간</th><th>요일</th><th>일/시간</th><th>편집</th></tr>
          </thead>
          <tbody>
            {(plans ?? []).map((p) => {
              const u = userMap.get(p.user_id);
              const w = wbMap.get(p.workbook_id);
              const days = ["월","화","수","목","금","토","일"]
                .filter((_, i) => (p.weekdays_mask & (1 << i)) !== 0)
                .join("·");
              return (
                <tr key={p.id}>
                  <td>{u?.name ?? "?"}</td>
                  <td>{w?.title ?? "?"}</td>
                  <td>{p.start_date} ~ {p.end_date}</td>
                  <td>{days}</td>
                  <td>{p.hours_per_day}h</td>
                  <td><Link className="btn-ghost" href={`/admin/plans/${p.id}`}>일별 편집</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
