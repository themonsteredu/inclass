import { google, drive_v3 } from "googleapis";
import { db } from "./db";

export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
];

export function oauthClient() {
  const cb = `${process.env.APP_URL}/api/drive/oauth/callback`;
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    cb
  );
}

export async function loadStoredTokens(): Promise<null | {
  access_token: string | null;
  refresh_token: string | null;
  expiry_date: string | null;
  scope: string | null;
}> {
  const { data } = await db()
    .from("drive_tokens")
    .select("access_token,refresh_token,expiry_date,scope")
    .eq("id", 1)
    .maybeSingle();
  return data ?? null;
}

export async function saveTokens(t: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string | null;
}) {
  await db()
    .from("drive_tokens")
    .upsert({
      id: 1,
      access_token: t.access_token ?? null,
      refresh_token: t.refresh_token ?? null,
      expiry_date: t.expiry_date ? new Date(t.expiry_date).toISOString() : null,
      scope: t.scope ?? null,
      updated_at: new Date().toISOString(),
    });
}

export async function getDriveClient(): Promise<drive_v3.Drive | null> {
  const t = await loadStoredTokens();
  if (!t || !t.refresh_token) return null;
  const o = oauthClient();
  o.setCredentials({
    access_token: t.access_token ?? undefined,
    refresh_token: t.refresh_token,
    expiry_date: t.expiry_date ? new Date(t.expiry_date).getTime() : undefined,
    scope: t.scope ?? undefined,
  });
  // Persist refreshed tokens back to DB so all instances stay in sync.
  o.on("tokens", async (tokens) => {
    await saveTokens({
      access_token: tokens.access_token ?? t.access_token,
      refresh_token: tokens.refresh_token ?? t.refresh_token,
      expiry_date: tokens.expiry_date ?? null,
      scope: tokens.scope ?? t.scope,
    });
  });
  return google.drive({ version: "v3", auth: o });
}

/** Returns video duration in seconds for a file, or 0 if unavailable. */
export async function getVideoDurationSec(fileId: string): Promise<number> {
  const drive = await getDriveClient();
  if (!drive) return 0;
  const meta = await drive.files.get({
    fileId,
    fields: "videoMediaMetadata(durationMillis)",
  });
  const ms = Number(meta.data.videoMediaMetadata?.durationMillis ?? 0);
  return Math.floor(ms / 1000);
}

/** A short-lived embed URL that requires the viewer to be the file's authorized owner.
 *  Drive doesn't issue per-viewer signed URLs, so we fall back to the standard preview
 *  URL. The uploader owns the file privately; sharing must remain "Restricted" so only
 *  accounts the owner has explicitly granted access can view. The page is rendered in
 *  an iframe via stream.php-equivalent route which checks our own login first. */
export function previewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
}
