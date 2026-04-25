import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { oauthClient, saveTokens } from "@/lib/drive";

export async function GET(req: Request) {
  await requireAdmin();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/admin/drive?error=no_code", process.env.APP_URL!));
  }
  const o = oauthClient();
  const { tokens } = await o.getToken(code);
  await saveTokens({
    access_token: tokens.access_token ?? null,
    refresh_token: tokens.refresh_token ?? null,
    expiry_date: tokens.expiry_date ?? null,
    scope: tokens.scope ?? null,
  });
  return NextResponse.redirect(new URL("/admin/drive", process.env.APP_URL!));
}
