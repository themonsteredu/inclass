import { db } from "@/lib/db";
import { addProblem, deleteProblem } from "../actions";
import LectureUploader from "./LectureUploader";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = { tip: "팁", concept: "개념", type: "유형" };

export default async function WorkbookEditPage({ params }: { params: { id: string } }) {
  const supa = db();
  const { data: wb } = await supa
    .from("workbooks")
    .select("id,title,description")
    .eq("id", params.id)
    .single();
  if (!wb) return <div>없는 문제집</div>;

  const { data: problems } = await supa
    .from("problems")
    .select("id,number,title")
    .eq("workbook_id", params.id)
    .order("number", { ascending: true });

  const ids = (problems ?? []).map((p) => p.id);
  const { data: lectures } = ids.length
    ? await supa.from("lectures").select("id,problem_id,kind,title,drive_file_id,duration_sec").in("problem_id", ids)
    : { data: [] as any[] };
  const byProblem = new Map<string, any[]>();
  for (const l of lectures ?? []) {
    const arr = byProblem.get(l.problem_id) || [];
    arr.push(l);
    byProblem.set(l.problem_id, arr);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{wb.title}</h1>
      {wb.description && <p className="text-gray-500">{wb.description}</p>}

      <form action={addProblem} className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input type="hidden" name="workbook_id" value={wb.id} />
        <div>
          <label className="label">번호</label>
          <input name="number" type="number" min={1} className="field" required />
        </div>
        <div className="md:col-span-2">
          <label className="label">문제 제목</label>
          <input name="title" className="field" />
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full" type="submit">문제 추가</button>
        </div>
      </form>

      <div className="space-y-3">
        {(problems ?? []).map((p) => {
          const ls = byProblem.get(p.id) || [];
          const has = (k: string) => ls.find((l) => l.kind === k);
          return (
            <div key={p.id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {p.number}번 {p.title ? `· ${p.title}` : ""}
                </div>
                <form action={deleteProblem}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="workbook_id" value={wb.id} />
                  <button className="btn-danger" type="submit">문제 삭제</button>
                </form>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["tip", "concept", "type"] as const).map((k) => {
                  const l = has(k);
                  return (
                    <div key={k} className="border rounded-md p-3">
                      <div className="text-sm font-semibold mb-1">{KIND_LABEL[k]}강의</div>
                      {l ? (
                        <div className="text-xs text-gray-500 break-all">
                          drive: {l.drive_file_id}<br />
                          길이: {Math.floor(l.duration_sec / 60)}분
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">미업로드</div>
                      )}
                      <LectureUploader problemId={p.id} kind={k} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
