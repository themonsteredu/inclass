import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { db } from "@/lib/db";
import { createWorkbook, deleteWorkbook } from "../actions";

export default async function AdminWorkbooksPage() {
  await requireAdmin();
  const workbooks = await db.workbook.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { problems: true } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">문제집 관리</h1>

      <form
        action={createWorkbook}
        className="mb-6 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-4"
      >
        <input
          name="title"
          placeholder="제목"
          required
          className="rounded border px-3 py-2 sm:col-span-2"
        />
        <input
          name="order"
          type="number"
          min={0}
          defaultValue={0}
          placeholder="순서"
          className="rounded border px-3 py-2"
        />
        <button className="rounded bg-slate-900 px-3 py-2 text-white hover:bg-slate-700">
          문제집 추가
        </button>
        <input
          name="description"
          placeholder="설명 (선택)"
          className="rounded border px-3 py-2 sm:col-span-4"
        />
      </form>

      <ul className="divide-y rounded-lg border bg-white">
        {workbooks.map((w) => (
          <li
            key={w.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <Link
                href={`/admin/workbooks/${w.id}`}
                className="font-medium hover:underline"
              >
                {w.title}
              </Link>
              <span className="ml-3 text-sm text-slate-500">
                문제 {w._count.problems}개
              </span>
            </div>
            <form action={deleteWorkbook}>
              <input type="hidden" name="id" value={w.id} />
              <button className="text-sm text-red-600 hover:underline">
                삭제
              </button>
            </form>
          </li>
        ))}
        {workbooks.length === 0 && (
          <li className="px-4 py-6 text-center text-slate-500">
            등록된 문제집이 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
}
