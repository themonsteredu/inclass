// Weekday bitmask helpers. Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64.
// Default mask = Mon-Sat = 63 (Sunday excluded).

export const WEEKDAY_LABELS_KO = ["월", "화", "수", "목", "금", "토", "일"];
export const DEFAULT_WEEKDAYS_MASK = 63; // Mon-Sat

export function weekdayBit(jsDay: number): number {
  // JS getDay(): Sun=0, Mon=1, ... Sat=6
  // Our bit:    Mon=1, Tue=2, ..., Sat=32, Sun=64
  if (jsDay === 0) return 64;
  return 1 << (jsDay - 1);
}

export function isStudyDay(date: Date, mask: number): boolean {
  return (mask & weekdayBit(date.getDay())) !== 0;
}

export function maskToList(mask: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 7; i++) if (mask & (1 << i)) out.push(i); // 0=Mon … 6=Sun
  return out;
}

export function listToMask(indices: number[]): number {
  return indices.reduce((m, i) => m | (1 << i), 0);
}

export function eachDateInRange(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (d <= last) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function fmtYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
