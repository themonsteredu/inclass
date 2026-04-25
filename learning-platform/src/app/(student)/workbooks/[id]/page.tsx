import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WorkbookDetail({ params }: { params: { id: string } }) {
  const u = await requireUser();
  const supa = db();
  const { data: wb } = await supa
    .from("workbooks")
    .select("id,title,description")
    .eq("id", params.id)
    .single();
  if (!wb) return <div>없는 문제집</div>;
  const { data: problems } = await supa
    .from("problems")
    .select("id,number,title")
    .eq("workbook_id", wb.id)
    .order("number", { ascending: true });
  const ids = (problems ?? []).map((p) => p.id);
  const { data: done } = ids.length
    ? await supa.from("problem_completions").select("problem_id").eq("user_id", u.id).in("problem_id", ids)
    : { data: [] as any[] };
  const doneSet = new Set((done ?? []).map((d) => d.problem_id));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{wb.title}</h1>
      <div className="card divide-y">
        {(problems ?? []).map((p) => (
          <Link key={p.id} href={`/problems/${p.id}`} className="p-3 flex items-center justify-between hover:bg-gray-50">
            <div>
              <span className="font-mono text-sm text-gray-500">{p.number}</span>{" "}
              <span>{p.title}</span>
            </div>
            {doneSet.has(p.id) && <span className="text-green-700 text-xs">완료</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
