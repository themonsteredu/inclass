import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtYMD } from "@/lib/dates";

export const dynamic = "force-dynamic";

function buildMonthGrid(year: number, month0: number) {
  const first = new Date(year, month0, 1);
  const startWeekday = (first.getDay() + 6) % 7; // make Monday = 0
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: { date: Date | null }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month0, d) });
  while (cells.length % 7 !== 0) cells.push({ date: null });
  return cells;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { y?: string; m?: string };
}) {
  const u = await requireUser();
  const now = new Date();
  const y = Number(searchParams.y ?? now.getFullYear());
  const m = Number(searchParams.m ?? now.getMonth() + 1);
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0);
  const supa = db();

  const { data: plans } = await supa
    .from("study_plans")
    .select("id")
    .eq("user_id", u.id);
  const planIds = (plans ?? []).map((p) => p.id);
  const { data: rows } = planIds.length
    ? await supa
        .from("plan_days")
        .select("date,problem_ids")
        .in("plan_id", planIds)
        .gte("date", fmtYMD(monthStart))
        .lte("date", fmtYMD(monthEnd))
    : { data: [] as any[] };

  // Aggregate problem counts per date
  const counts = new Map<string, string[]>();
  for (const r of rows ?? []) {
    const arr = counts.get(r.date) || [];
    counts.set(r.date, arr.concat(r.problem_ids as string[]));
  }

  const allPids = Array.from(new Set(Array.from(counts.values()).flat()));
  const { data: done } = allPids.length
    ? await supa
        .from("problem_completions")
        .select("problem_id")
        .eq("user_id", u.id)
        .in("problem_id", allPids)
    : { data: [] as any[] };
  const doneSet = new Set((done ?? []).map((d) => d.problem_id));

  const cells = buildMonthGrid(y, m - 1);
  const today = fmtYMD(new Date());

  // Cumulative progress for the month
  let plannedTotal = 0;
  let doneTotal = 0;
  for (const [, pids] of counts.entries()) {
    plannedTotal += pids.length;
    for (const pid of pids) if (doneSet.has(pid)) doneTotal++;
  }
  const pct = plannedTotal ? Math.round((doneTotal / plannedTotal) * 100) : 0;

  const prevMonth = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{y}년 {m}월</h1>
        <div className="space-x-2">
          <a className="btn-ghost" href={`/calendar?y=${prevMonth.y}&m=${prevMonth.m}`}>이전</a>
          <a className="btn-ghost" href={`/calendar?y=${nextMonth.y}&m=${nextMonth.m}`}>다음</a>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm text-gray-500">이번 달 진척률</div>
        <div className="flex items-center gap-3 mt-1">
          <div className="text-2xl font-semibold">{pct}%</div>
          <div className="flex-1 h-2 rounded bg-gray-200 overflow-hidden">
            <div className="h-full bg-brand-600" style={{ width: pct + "%" }} />
          </div>
          <div className="text-sm text-gray-500">{doneTotal}/{plannedTotal}</div>
        </div>
      </div>

      <div className="card p-2">
        <div className="grid grid-cols-7 text-xs text-center font-medium text-gray-500 py-1">
          {["월","화","수","목","금","토","일"].map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c.date) return <div key={i} className="h-20" />;
            const ds = fmtYMD(c.date);
            const pids = counts.get(ds) || [];
            const planned = pids.length;
            const dn = pids.filter((p) => doneSet.has(p)).length;
            const isPast = ds < today;
            const isToday = ds === today;
            const overdue = isPast && dn < planned;
            return (
              <div
                key={i}
                className={
                  "h-20 rounded border p-1 text-xs flex flex-col " +
                  (isToday ? "border-brand-500 ring-1 ring-brand-500 " : "border-gray-200 ") +
                  (overdue ? "bg-red-50 " : "")
                }
              >
                <div className="font-mono text-[11px] text-gray-500">{c.date.getDate()}</div>
                {planned > 0 && (
                  <div className="mt-auto">
                    <div className="text-[11px]">{dn}/{planned}</div>
                    <div className="h-1 rounded bg-gray-200 overflow-hidden">
                      <div
                        className={"h-full " + (dn === planned ? "bg-green-500" : "bg-brand-500")}
                        style={{ width: planned ? (dn / planned) * 100 + "%" : "0%" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
