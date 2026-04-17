import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessWorkbook } from "@/lib/enrollments";
import { LecturePlayer } from "@/components/LecturePlayer";
import { formatSeconds, LECTURE_TYPE_LABEL } from "@/lib/format";

export default async function LecturePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const lecture = await db.lecture.findUnique({
    where: { id: params.id },
    include: { problem: { include: { workbook: true } } },
  });
  if (!lecture) notFound();
  if (
    !(await canAccessWorkbook(
      session.user.id,
      session.user.role,
      lecture.problem.workbookId,
    ))
  ) {
    redirect("/workbooks");
  }

  const log = await db.watchLog.findUnique({
    where: {
      userId_lectureId: { userId: session.user.id, lectureId: lecture.id },
    },
  });

  return (
    <div>
      <div className="mb-3 text-sm text-slate-500">
        <Link href={`/workbooks/${lecture.problem.workbookId}`} className="hover:underline">
          {lecture.problem.workbook.title}
        </Link>
        <span className="mx-1">/</span>
        <Link href={`/problems/${lecture.problemId}`} className="hover:underline">
          #{lecture.problem.number} {lecture.problem.title}
        </Link>
      </div>

      <h1 className="mb-1 text-xl font-semibold">{lecture.title}</h1>
      <div className="mb-4 text-sm text-slate-500">
        {LECTURE_TYPE_LABEL[lecture.type]} · 길이 {formatSeconds(lecture.duration)} ·
        누적 시청 {formatSeconds(log?.watchedSeconds ?? 0)}
        {log?.completed && <span className="ml-2 text-emerald-600">완료</span>}
      </div>

      <LecturePlayer
        lectureId={lecture.id}
        src={`/api/lectures/${lecture.id}/stream`}
        initialPosition={log?.lastPosition ?? 0}
      />
    </div>
  );
}
