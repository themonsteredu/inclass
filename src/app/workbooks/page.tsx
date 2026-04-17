import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function WorkbooksPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const workbooks = await db.workbook.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { problems: true } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">문제집</h1>
      {workbooks.length === 0 ? (
        <p className="text-slate-600">등록된 문제집이 없습니다.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {workbooks.map((w) => (
            <li key={w.id}>
              <Link
                href={`/workbooks/${w.id}`}
                className="block rounded-lg border bg-white p-4 shadow-sm hover:border-slate-400"
              >
                <div className="text-lg font-medium">{w.title}</div>
                {w.description && (
                  <div className="mt-1 text-sm text-slate-600">{w.description}</div>
                )}
                <div className="mt-2 text-xs text-slate-500">
                  문제 {w._count.problems}개
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
