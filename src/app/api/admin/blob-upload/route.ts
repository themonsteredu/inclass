import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

// Client-side upload flow (see @vercel/blob/client).
// The client first calls this endpoint to get a short-lived signed token,
// then uploads the file directly to Vercel Blob storage.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "video/mp4",
          "video/webm",
          "video/quicktime",
          "video/x-matroska",
          "video/x-m4v",
        ],
        maximumSizeInBytes: 2 * 1024 * 1024 * 1024, // 2 GB 한도
      }),
      onUploadCompleted: async () => {
        // 업로드 완료 훅 (DB 기록은 /api/admin/lectures 에서 처리)
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "upload error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
