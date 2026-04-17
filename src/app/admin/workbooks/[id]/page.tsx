import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { db } from "@/lib/db";
import { LECTURE_TYPE_LABEL, formatSeconds } from "@/lib/format";
import { createProblem, deleteProblem } from "../../actions";

const TYPE_ORDER = ["TIP", "CONCEPT", "PATTERN"] as const;
type TType = (typeof TYPE_ORDER)[number];

export default async function AdminWorkbookDetail({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const workbook = await db.workbook.findUnique({
    where: { id: params.id },
    include: {
      problems: {
        orderBy: { number: "asc" },
        include: { lectures: true },
      },
    },
  });
  if (!workbook) notFound();

  return (
    <div>
      <div className="mb-2 text-sm">
        <Link href="/admin/workbooks" className="text-slate-500 hover:underline">
          ← 문제집 목록
        </Link>
      </div>
      <h1 className="mb-4 text-2xl font-semibold">{workbook.title}</h1>

      <form
        action={createProblem}
        className="mb-6 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-5"
      >
        <input type="hidden" name="workbookId" value={workbook.id} />
        <input
          name="number"
          type="number"
          min={1}
          placeholder="번호"
          required
          className="rounded border px-3 py-2"
        />
        <input
          name="title"
          placeholder="문제 제목"
          required
          className="rounded border px-3 py-2 sm:col-span-3"
        />
        <button className="rounded bg-slate-900 px-3 py-2 text-white hover:bg-slate-700">
          문제 추가
        </button>
      </form>

      <ul className="space-y-3">
        {workbook.problems.map((p) => (
          <li key={p.id} className="rounded-lg border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="mr-2 text-slate-500">#{p.number}</span>
                <span className="font-medium">{p.title}</span>
              </div>
              <form action={deleteProblem}>
                <input type="hidden" name="id" value={p.id} />
                <button className="text-sm text-red-600 hover:underline">
                  문제 삭제
                </button>
              </form>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {TYPE_ORDER.map((t) => {
                const lec = p.lectures.find((l) => l.type === t);
                return (
                  <div key={t} className="rounded border p-3">
                    <div className="text-xs text-slate-500">
                      {LECTURE_TYPE_LABEL[t]}
                    </div>
                    {lec ? (
                      <>
                        <div className="text-sm font-medium">{lec.title}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatSeconds(lec.duration)} ·{" "}
                          {(lec.sizeBytes / (1024 * 1024)).toFixed(1)}MB
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-400">미업로드</div>
                    )}
                    <UploadForm problemId={p.id} type={t} existingTitle={lec?.title} />
                  </div>
                );
              })}
            </div>
          </li>
        ))}
        {workbook.problems.length === 0 && (
          <li className="rounded-lg border bg-white p-6 text-center text-slate-500">
            문제를 추가해 주세요.
          </li>
        )}
      </ul>
    </div>
  );
}

import { UploadForm } from "./UploadForm";
