import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { DRIVE_SCOPES, oauthClient } from "@/lib/drive";

export async function GET() {
  await requireAdmin();
  const url = oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: DRIVE_SCOPES,
  });
  return NextResponse.redirect(url);
}
