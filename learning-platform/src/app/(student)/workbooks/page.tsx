import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WorkbooksList() {
  const u = await requireUser();
  const supa = db();
  // Workbooks the student has access to = those that appear in their plans or roadmap.
  const [{ data: plans }, { data: road }] = await Promise.all([
    supa.from("study_plans").select("workbook_id").eq("user_id", u.id),
    supa.from("roadmaps").select("id").eq("user_id", u.id).maybeSingle(),
  ]);
  let roadIds: string[] = [];
  if (road) {
    const { data: items } = await supa
      .from("roadmap_items")
      .select("workbook_id")
      .eq("roadmap_id", road.id);
    roadIds = (items ?? []).map((i) => i.workbook_id);
  }
  const ids = Array.from(new Set([...(plans ?? []).map((p) => p.workbook_id), ...roadIds]));
  const { data: wbs } = ids.length
    ? await supa.from("workbooks").select("id,title,description").in("id", ids)
    : { data: [] as any[] };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">내 문제집</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(wbs ?? []).map((w) => (
          <Link key={w.id} href={`/workbooks/${w.id}`} className="card p-4 hover:bg-gray-50">
            <div className="font-medium">{w.title}</div>
            {w.description && <div className="text-sm text-gray-500">{w.description}</div>}
          </Link>
        ))}
        {(!wbs || wbs.length === 0) && (
          <div className="card p-6 text-gray-500">배정된 문제집이 없어요.</div>
        )}
      </div>
    </div>
  );
}
