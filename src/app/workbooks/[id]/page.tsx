import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function WorkbookDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const workbook = await db.workbook.findUnique({
    where: { id: params.id },
    include: {
      problems: {
        orderBy: { number: "asc" },
        include: {
          lectures: { select: { id: true, type: true } },
        },
      },
    },
  });
  if (!workbook) notFound();

  const lectureIds = workbook.problems.flatMap((p) => p.lectures.map((l) => l.id));
  const logs = lectureIds.length
    ? await db.watchLog.findMany({
        where: { userId: session.user.id, lectureId: { in: lectureIds } },
        select: { lectureId: true, completed: true },
      })
    : [];
  const completedByLecture = new Map(logs.map((l) => [l.lectureId, l.completed]));

  return (
    <div>
      <div className="mb-4">
        <Link href="/workbooks" className="text-sm text-slate-500 hover:underline">
          ← 문제집 목록
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">{workbook.title}</h1>
      {workbook.description && (
        <p className="mt-1 text-slate-600">{workbook.description}</p>
      )}

      <ul className="mt-6 divide-y rounded-lg border bg-white">
        {workbook.problems.map((p) => {
          const done = p.lectures.filter((l) => completedByLecture.get(l.id)).length;
          return (
            <li key={p.id}>
              <Link
                href={`/problems/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <span className="mr-2 text-slate-500">#{p.number}</span>
                  <span className="font-medium">{p.title}</span>
                </div>
                <div className="text-sm text-slate-500">
                  강의 {p.lectures.length}개 · 완료 {done}개
                </div>
              </Link>
            </li>
          );
        })}
        {workbook.problems.length === 0 && (
          <li className="px-4 py-6 text-center text-slate-500">
            등록된 문제가 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
}
