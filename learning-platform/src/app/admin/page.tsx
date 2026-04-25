import { db } from "@/lib/db";

export default async function AdminDashboard() {
  const supa = db();
  const [users, workbooks, lectures, plans] = await Promise.all([
    supa.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
    supa.from("workbooks").select("*", { count: "exact", head: true }),
    supa.from("lectures").select("*", { count: "exact", head: true }),
    supa.from("study_plans").select("*", { count: "exact", head: true }),
  ]);
  const cards = [
    { label: "학생 수", value: users.count ?? 0 },
    { label: "문제집", value: workbooks.count ?? 0 },
    { label: "강의 수", value: lectures.count ?? 0 },
    { label: "학습 플랜", value: plans.count ?? 0 },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">대시보드</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="text-2xl font-semibold mt-1">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
