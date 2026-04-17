import { db } from "./db";

// Returns the set of workbook IDs the given user is allowed to see.
// Admins see everything (empty "all" sentinel handled by caller).
export async function getVisibleWorkbookIds(userId: string): Promise<Set<string>> {
  const rows = await db.enrollment.findMany({
    where: { userId },
    select: { workbookId: true },
  });
  return new Set(rows.map((r) => r.workbookId));
}

export async function canAccessWorkbook(
  userId: string,
  role: string,
  workbookId: string,
): Promise<boolean> {
  if (role === "ADMIN") return true;
  const found = await db.enrollment.findUnique({
    where: { userId_workbookId: { userId, workbookId } },
  });
  return !!found;
}

export async function canAccessLecture(
  userId: string,
  role: string,
  lectureId: string,
): Promise<boolean> {
  if (role === "ADMIN") return true;
  const lec = await db.lecture.findUnique({
    where: { id: lectureId },
    select: { problem: { select: { workbookId: true } } },
  });
  if (!lec) return false;
  return canAccessWorkbook(userId, role, lec.problem.workbookId);
}
