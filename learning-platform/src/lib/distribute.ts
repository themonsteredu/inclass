import { eachDateInRange, fmtYMD, isStudyDay } from "./dates";

export type DistributeInput = {
  startDate: Date;
  endDate: Date;
  weekdaysMask: number;
  problemIds: string[]; // ordered list of problems in the workbook
};

export type DistributeOutput = {
  date: string;          // YYYY-MM-DD
  problemIds: string[];
}[];

/**
 * Distribute problems evenly across study days in [startDate, endDate].
 * - Only days matching `weekdaysMask` are study days.
 * - Each study day gets floor(N/D) problems; remainder gets +1 on the earliest days.
 * - Problems are assigned in their given order so a workbook is studied front-to-back.
 *
 * Throws if there are zero study days in the range.
 */
export function distributeProblems(input: DistributeInput): DistributeOutput {
  const { startDate, endDate, weekdaysMask, problemIds } = input;
  const days = eachDateInRange(startDate, endDate).filter((d) =>
    isStudyDay(d, weekdaysMask)
  );
  if (days.length === 0) {
    throw new Error("선택한 요일 마스크 안에 학습 가능한 날짜가 0일입니다.");
  }
  const N = problemIds.length;
  const D = days.length;
  const base = Math.floor(N / D);
  const remainder = N % D;
  const out: DistributeOutput = [];
  let cursor = 0;
  for (let i = 0; i < D; i++) {
    const take = base + (i < remainder ? 1 : 0);
    const slice = problemIds.slice(cursor, cursor + take);
    cursor += take;
    out.push({ date: fmtYMD(days[i]), problemIds: slice });
  }
  return out;
}
