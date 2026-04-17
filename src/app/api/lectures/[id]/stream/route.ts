import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessLecture } from "@/lib/enrollments";

export const runtime = "nodejs";

// Redirects the client to the Vercel Blob URL after verifying the user
// is enrolled in the parent workbook (or is an admin). The Blob URL itself
// is public-but-unguessable; login-gating on the app is the primary
// protection. For stricter control, swap Blob for a signed-URL provider.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  if (!(await canAccessLecture(session.user.id, session.user.role, params.id))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const lecture = await db.lecture.findUnique({ where: { id: params.id } });
  if (!lecture) return new NextResponse("Not Found", { status: 404 });
  if (!lecture.filePath) return new NextResponse("File missing", { status: 404 });

  return NextResponse.redirect(lecture.filePath, 302);
}
