import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { db } from "@/lib/db";
import { formatSeconds } from "@/lib/format";

export default async function AdminDashboard() {
  await requireAdmin();

  const [userCount, workbookCount, problemCount, lectureCount, totalSecondsAgg] =
    await Promise.all([
      db.user.count({ where: { role: "STUDENT" } }),
      db.workbook.count(),
      db.problem.count(),
      db.lecture.count(),
      db.watchLog.aggregate({ _sum: { watchedSeconds: true } }),
    ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">관리자 대시보드</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="학생" value={`${userCount}명`} />
        <Stat label="문제집" value={`${workbookCount}개`} />
        <Stat label="문제" value={`${problemCount}개`} />
        <Stat label="강의" value={`${lectureCount}개`} />
        <Stat
          label="누적 시청 시간"
          value={formatSeconds(totalSecondsAgg._sum.watchedSeconds ?? 0)}
        />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Card
          href="/admin/workbooks"
          title="문제집 / 문제 / 강의 관리"
          desc="문제집을 만들고 문제를 추가한 뒤 강의 영상을 업로드하세요."
        />
        <Card
          href="/admin/users"
          title="학생 계정 관리"
          desc="학생을 등록하고 비밀번호를 발급합니다."
        />
        <Card
          href="/admin/enrollments"
          title="강의 접근 권한"
          desc="학생별로 볼 수 있는 문제집을 지정합니다."
        />
        <Card
          href="/admin/analytics"
          title="수강 현황 조회"
          desc="학생별/강의별 시청 시간 및 완료 여부를 확인합니다."
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border bg-white p-4 shadow-sm hover:border-slate-400"
    >
      <div className="text-lg font-medium">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
    </Link>
  );
}
