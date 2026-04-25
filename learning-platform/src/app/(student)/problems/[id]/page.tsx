import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import MarkDoneButton from "./MarkDoneButton";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = { tip: "팁", concept: "개념", type: "유형" };

export default async function ProblemPage({ params }: { params: { id: string } }) {
  const u = await requireUser();
  const supa = db();
  const { data: problem } = await supa
    .from("problems")
    .select("id,number,title,workbook_id")
    .eq("id", params.id)
    .single();
  if (!problem) return <div>없는 문제</div>;
  const { data: workbook } = await supa
    .from("workbooks")
    .select("title")
    .eq("id", problem.workbook_id)
    .single();
  const { data: lectures } = await supa
    .from("lectures")
    .select("id,kind,title,duration_sec")
    .eq("problem_id", problem.id);
  const { data: done } = await supa
    .from("problem_completions")
    .select("problem_id")
    .eq("user_id", u.id)
    .eq("problem_id", problem.id)
    .maybeSingle();

  const lectureMap = new Map<string, any>();
  for (const l of lectures ?? []) lectureMap.set(l.kind, l);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">{workbook?.title}</div>
      <h1 className="text-2xl font-semibold">
        {problem.number}번 {problem.title ? `· ${problem.title}` : ""}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["tip", "concept", "type"] as const).map((k) => {
          const l = lectureMap.get(k);
          return (
            <div key={k} className="card p-4">
              <div className="text-sm font-semibold">{KIND_LABEL[k]}강의</div>
              {l ? (
                <>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.floor(l.duration_sec / 60)}분
                  </div>
                  <Link className="btn-primary mt-3 inline-block" href={`/lectures/${l.id}`}>
                    재생
                  </Link>
                </>
              ) : (
                <div className="text-xs text-gray-400 mt-1">미업로드</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div>
          {done ? (
            <span className="text-green-700">이 문제를 완료했어요</span>
          ) : (
            <span className="text-gray-600">문제를 다 풀었으면 완료로 표시하세요.</span>
          )}
        </div>
        <MarkDoneButton problemId={problem.id} done={!!done} />
      </div>
    </div>
  );
}
