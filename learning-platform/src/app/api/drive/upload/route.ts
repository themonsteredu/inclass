import { NextResponse } from "next/server";
import { Readable } from "stream";
import { requireAdmin } from "@/lib/auth";
import { getDriveClient, getVideoDurationSec } from "@/lib/drive";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Multipart upload: fields = file (Blob), problem_id, kind, title?
 *  Returns { lecture_id, drive_file_id, duration_sec } */
export async function POST(req: Request) {
  await requireAdmin();
  const drive = await getDriveClient();
  if (!drive) {
    return NextResponse.json({ error: "Drive 미연결" }, { status: 400 });
  }
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const problem_id = String(form.get("problem_id") || "");
  const kind = String(form.get("kind") || "");
  const title = String(form.get("title") || "") || null;
  if (!file || !problem_id || !["tip", "concept", "type"].includes(kind)) {
    return NextResponse.json({ error: "잘못된 입력" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const created = await drive.files.create({
    requestBody: { name: file.name, mimeType: file.type || "video/mp4" },
    media: { mimeType: file.type || "video/mp4", body: Readable.from(buf) },
    fields: "id",
  });
  const drive_file_id = created.data.id!;
  const duration_sec = await getVideoDurationSec(drive_file_id);

  // upsert lecture (one tip/concept/type per problem)
  const { data, error } = await db()
    .from("lectures")
    .upsert(
      { problem_id, kind, title, drive_file_id, duration_sec },
      { onConflict: "problem_id,kind" }
    )
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lecture_id: data.id, drive_file_id, duration_sec });
}
