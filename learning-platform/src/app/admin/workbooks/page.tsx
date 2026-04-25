import Link from "next/link";
import { db } from "@/lib/db";
import { createWorkbook, deleteWorkbook } from "./actions";

export const dynamic = "force-dynamic";

export default async function WorkbooksPage() {
  const { data: list } = await db()
    .from("workbooks")
    .select("id,title,description,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">문제집</h1>

      <form action={createWorkbook} className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <label className="label">제목</label>
          <input name="title" className="field" required />
        </div>
        <div className="md:col-span-1">
          <label className="label">설명</label>
          <input name="description" className="field" />
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full" type="submit">추가</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>제목</th><th>설명</th><th>관리</th></tr>
          </thead>
          <tbody>
            {(list ?? []).map((w) => (
              <tr key={w.id}>
                <td><Link className="text-brand-600 hover:underline" href={`/admin/workbooks/${w.id}`}>{w.title}</Link></td>
                <td className="text-gray-500">{w.description}</td>
                <td>
                  <form action={deleteWorkbook}>
                    <input type="hidden" name="id" value={w.id} />
                    <button className="btn-danger" type="submit">삭제</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
