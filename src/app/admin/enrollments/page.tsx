import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { db } from "@/lib/db";

export default async function EnrollmentsIndex() {
  await requireAdmin();
  const students = await db.user.findMany({
    where: { role: "STUDENT" },
    orderBy: [{ createdAt: "asc" }],
    include: { _count: { select: { enrollments: true } } },
  });
  const totalWorkbooks = await db.workbook.count();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">강의 접근 권한</h1>
      <p className="mb-4 text-sm text-slate-600">
        학생별로 접근 가능한 문제집을 지정하세요. 체크된 문제집에 속한 모든
        문제/강의를 해당 학생이 볼 수 있습니다.
      </p>

      <table className="w-full overflow-hidden rounded-lg border bg-white text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-3 py-2">학생</th>
            <th className="px-3 py-2">아이디</th>
            <th className="px-3 py-2">접근 가능 문제집</th>
            <th className="px-3 py-2">권한 편집</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="px-3 py-2">{s.name}</td>
              <td className="px-3 py-2 font-mono">{s.username}</td>
              <td className="px-3 py-2">
                {s._count.enrollments} / {totalWorkbooks}
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/admin/enrollments/${s.id}`}
                  className="text-blue-600 hover:underline"
                >
                  편집
                </Link>
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                등록된 학생이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
