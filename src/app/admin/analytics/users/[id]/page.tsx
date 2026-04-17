import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { db } from "@/lib/db";
import { LECTURE_TYPE_LABEL, formatSeconds } from "@/lib/format";

export default async function UserAnalyticsPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) notFound();

  const logs = await db.watchLog.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      lecture: { include: { problem: { include: { workbook: true } } } },
    },
  });

  const total = logs.reduce((sum, l) => sum + l.watchedSeconds, 0);
  const completedCount = logs.filter((l) => l.completed).length;

  return (
    <div>
      <div className="mb-2 text-sm">
        <Link href="/admin/analytics" className="text-slate-500 hover:underline">
          ← 수강 현황
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">
        {user.name}{" "}
        <span className="text-base font-normal text-slate-500">
          ({user.username})
        </span>
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        누적 시청 {formatSeconds(total)} · 완료 {completedCount} / {logs.length}
      </p>

      <table className="mt-4 w-full overflow-hidden rounded-lg border bg-white text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-3 py-2">문제집</th>
            <th className="px-3 py-2">문제</th>
            <th className="px-3 py-2">유형</th>
            <th className="px-3 py-2">강의</th>
            <th className="px-3 py-2">시청</th>
            <th className="px-3 py-2">길이</th>
            <th className="px-3 py-2">완료</th>
            <th className="px-3 py-2">마지막 수강</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="px-3 py-2">{l.lecture.problem.workbook.title}</td>
              <td className="px-3 py-2">
                #{l.lecture.problem.number} {l.lecture.problem.title}
              </td>
              <td className="px-3 py-2">{LECTURE_TYPE_LABEL[l.lecture.type]}</td>
              <td className="px-3 py-2">{l.lecture.title}</td>
              <td className="px-3 py-2">{formatSeconds(l.watchedSeconds)}</td>
              <td className="px-3 py-2">{formatSeconds(l.lecture.duration)}</td>
              <td className="px-3 py-2">
                {l.completed ? (
                  <span className="text-emerald-600">완료</span>
                ) : (
                  <span className="text-slate-400">진행중</span>
                )}
              </td>
              <td className="px-3 py-2 text-slate-500">
                {l.updatedAt.toISOString().replace("T", " ").slice(0, 16)}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                시청 기록이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
