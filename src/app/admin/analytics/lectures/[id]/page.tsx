import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { db } from "@/lib/db";
import { LECTURE_TYPE_LABEL, formatSeconds } from "@/lib/format";

export default async function LectureAnalyticsPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const lecture = await db.lecture.findUnique({
    where: { id: params.id },
    include: { problem: { include: { workbook: true } } },
  });
  if (!lecture) notFound();

  const logs = await db.watchLog.findMany({
    where: { lectureId: lecture.id },
    include: { user: true },
    orderBy: { watchedSeconds: "desc" },
  });

  return (
    <div>
      <div className="mb-2 text-sm">
        <Link href="/admin/analytics" className="text-slate-500 hover:underline">
          ← 수강 현황
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">
        [{LECTURE_TYPE_LABEL[lecture.type]}] {lecture.title}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {lecture.problem.workbook.title} / #{lecture.problem.number}{" "}
        {lecture.problem.title} · 길이 {formatSeconds(lecture.duration)}
      </p>

      <table className="mt-4 w-full overflow-hidden rounded-lg border bg-white text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-3 py-2">학생</th>
            <th className="px-3 py-2">아이디</th>
            <th className="px-3 py-2">시청</th>
            <th className="px-3 py-2">진행률</th>
            <th className="px-3 py-2">마지막 위치</th>
            <th className="px-3 py-2">완료</th>
            <th className="px-3 py-2">최근 수강</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => {
            const pct =
              lecture.duration > 0
                ? Math.min(
                    100,
                    Math.round((l.watchedSeconds / lecture.duration) * 100),
                  )
                : 0;
            return (
              <tr key={l.id} className="border-t">
                <td className="px-3 py-2">{l.user.name}</td>
                <td className="px-3 py-2 font-mono">{l.user.username}</td>
                <td className="px-3 py-2">{formatSeconds(l.watchedSeconds)}</td>
                <td className="px-3 py-2">{pct}%</td>
                <td className="px-3 py-2">{formatSeconds(l.lastPosition)}</td>
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
            );
          })}
          {logs.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                시청 기록이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
