import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { db } from "@/lib/db";
import { formatSeconds } from "@/lib/format";

export default async function AnalyticsPage() {
  await requireAdmin();

  const [students, perStudent, perLecture] = await Promise.all([
    db.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "asc" },
    }),
    db.watchLog.groupBy({
      by: ["userId"],
      _sum: { watchedSeconds: true },
      _count: { _all: true },
    }),
    db.watchLog.groupBy({
      by: ["lectureId"],
      _sum: { watchedSeconds: true },
      _count: { _all: true },
    }),
  ]);

  const byUser = new Map(
    perStudent.map((row) => [row.userId, row]),
  );
  const lectureIds = perLecture.map((r) => r.lectureId);
  const lectures = await db.lecture.findMany({
    where: { id: { in: lectureIds } },
    include: { problem: { include: { workbook: true } } },
  });
  const lectureMap = new Map(lectures.map((l) => [l.id, l]));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">수강 현황</h1>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium">학생별 총 시청 시간</h2>
        <table className="w-full overflow-hidden rounded-lg border bg-white text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">학생</th>
              <th className="px-3 py-2">아이디</th>
              <th className="px-3 py-2">수강 강의 수</th>
              <th className="px-3 py-2">누적 시청</th>
              <th className="px-3 py-2">상세</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const row = byUser.get(s.id);
              return (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 font-mono">{s.username}</td>
                  <td className="px-3 py-2">{row?._count._all ?? 0}</td>
                  <td className="px-3 py-2">
                    {formatSeconds(row?._sum.watchedSeconds ?? 0)}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/analytics/users/${s.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      상세보기
                    </Link>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  학생이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">강의별 시청 합계</h2>
        <table className="w-full overflow-hidden rounded-lg border bg-white text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-3 py-2">문제집</th>
              <th className="px-3 py-2">문제</th>
              <th className="px-3 py-2">강의</th>
              <th className="px-3 py-2">시청자 수</th>
              <th className="px-3 py-2">누적 시청</th>
              <th className="px-3 py-2">상세</th>
            </tr>
          </thead>
          <tbody>
            {perLecture.map((row) => {
              const lec = lectureMap.get(row.lectureId);
              if (!lec) return null;
              return (
                <tr key={row.lectureId} className="border-t">
                  <td className="px-3 py-2">{lec.problem.workbook.title}</td>
                  <td className="px-3 py-2">
                    #{lec.problem.number} {lec.problem.title}
                  </td>
                  <td className="px-3 py-2">
                    [{lec.type}] {lec.title}
                  </td>
                  <td className="px-3 py-2">{row._count._all}</td>
                  <td className="px-3 py-2">
                    {formatSeconds(row._sum.watchedSeconds ?? 0)}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/analytics/lectures/${row.lectureId}`}
                      className="text-blue-600 hover:underline"
                    >
                      상세보기
                    </Link>
                  </td>
                </tr>
              );
            })}
            {perLecture.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  시청 기록이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
