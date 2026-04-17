import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessWorkbook } from "@/lib/enrollments";
import { formatSeconds, LECTURE_TYPE_LABEL } from "@/lib/format";

const TYPE_ORDER: readonly string[] = ["TIP", "CONCEPT", "PATTERN"];
const TYPE_CARDS = ["TIP", "CONCEPT", "PATTERN"] as const;

export default async function ProblemPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const problem = await db.problem.findUnique({
    where: { id: params.id },
    include: { workbook: true, lectures: true },
  });
  if (!problem) notFound();
  if (!(await canAccessWorkbook(session.user.id, session.user.role, problem.workbookId))) {
    redirect("/workbooks");
  }

  const logs = await db.watchLog.findMany({
    where: {
      userId: session.user.id,
      lectureId: { in: problem.lectures.map((l) => l.id) },
    },
  });
  const logByLecture = new Map(logs.map((l) => [l.lectureId, l]));

  const lectures = [...problem.lectures].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type),
  );

  return (
    <div>
      <div className="mb-4 text-sm">
        <Link href={`/workbooks/${problem.workbookId}`} className="text-slate-500 hover:underline">
          ← {problem.workbook.title}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">
        <span className="mr-2 text-slate-500">#{problem.number}</span>
        {problem.title}
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {TYPE_CARDS.map((t) => {
          const lec = lectures.find((l) => l.type === t);
          if (!lec) {
            return (
              <div
                key={t}
                className="rounded-lg border bg-white p-4 opacity-60"
              >
                <div className="text-sm text-slate-500">{LECTURE_TYPE_LABEL[t]}</div>
                <div className="mt-1 font-medium">준비 중</div>
              </div>
            );
          }
          const log = logByLecture.get(lec.id);
          return (
            <Link
              key={t}
              href={`/lectures/${lec.id}`}
              className="rounded-lg border bg-white p-4 shadow-sm hover:border-slate-400"
            >
              <div className="text-sm text-slate-500">{LECTURE_TYPE_LABEL[t]}</div>
              <div className="mt-1 font-medium">{lec.title}</div>
              <div className="mt-3 text-xs text-slate-500">
                길이 {formatSeconds(lec.duration)} · 시청 {formatSeconds(log?.watchedSeconds ?? 0)}
                {log?.completed && <span className="ml-2 text-emerald-600">완료</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
