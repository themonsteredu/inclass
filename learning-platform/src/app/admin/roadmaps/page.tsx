import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RoadmapsListPage() {
  const supa = db();
  const { data: students } = await supa
    .from("users")
    .select("id,login_id,name,status")
    .eq("role", "student")
    .order("name", { ascending: true });
  const ids = (students ?? []).map((s) => s.id);
  const { data: roads } = ids.length
    ? await supa.from("roadmaps").select("id,user_id,start_date,end_date").in("user_id", ids)
    : { data: [] as any[] };
  const byUser = new Map<string, any>();
  for (const r of roads ?? []) byUser.set(r.user_id, r);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">2년 로드맵</h1>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>학생</th><th>아이디</th><th>상태</th><th>로드맵 기간</th><th>관리</th></tr>
          </thead>
          <tbody>
            {(students ?? []).map((s) => {
              const r = byUser.get(s.id);
              return (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td className="font-mono">{s.login_id}</td>
                  <td>{s.status === "active" ? "활성" : "휴면"}</td>
                  <td>{r ? `${r.start_date} ~ ${r.end_date}` : "미설정"}</td>
                  <td><Link className="btn-ghost" href={`/admin/roadmaps/${s.id}`}>편집</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
