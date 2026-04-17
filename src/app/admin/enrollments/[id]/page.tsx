import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { db } from "@/lib/db";
import { setEnrollments } from "../../actions";

export default async function UserEnrollmentPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) notFound();

  const [workbooks, enrollments] = await Promise.all([
    db.workbook.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { problems: true } } },
    }),
    db.enrollment.findMany({
      where: { userId: user.id },
      select: { workbookId: true },
    }),
  ]);
  const enrolled = new Set(enrollments.map((e) => e.workbookId));

  return (
    <div>
      <div className="mb-2 text-sm">
        <Link href="/admin/enrollments" className="text-slate-500 hover:underline">
          ← 권한 목록
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">
        {user.name}{" "}
        <span className="text-base font-normal text-slate-500">
          ({user.username})
        </span>
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        이 학생이 접근할 수 있는 문제집을 체크하세요.
      </p>

      <form action={setEnrollments} className="mt-4">
        <input type="hidden" name="userId" value={user.id} />

        <div className="overflow-hidden rounded-lg border bg-white">
          {workbooks.length === 0 ? (
            <p className="px-4 py-6 text-center text-slate-500">
              등록된 문제집이 없습니다.
            </p>
          ) : (
            <ul className="divide-y">
              {workbooks.map((w) => (
                <li key={w.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      name="workbookIds"
                      value={w.id}
                      defaultChecked={enrolled.has(w.id)}
                      className="h-4 w-4"
                    />
                    <span className="flex-1">
                      <span className="font-medium">{w.title}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        문제 {w._count.problems}개
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
