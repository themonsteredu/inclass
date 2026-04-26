// Vimeo — minimal client.
//
// Three things we need:
//  1) fetch video metadata (duration, status) by video id
//  2) build the player embed URL (security comes from Vimeo-side privacy:
//     "Hide from Vimeo" + domain whitelist on the Plus plan or higher)
//  3) sanity-check the access token (used by /admin/vimeo status page)
//
// We use a Personal Access Token (PAT) created in the Vimeo developer console.
// All requests are server-side; the token never leaves the server.

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function accessToken(): string {
  return env("VIMEO_ACCESS_TOKEN");
}

const API_BASE = "https://api.vimeo.com";

/** Accept either a numeric Vimeo id or a vimeo.com URL and return just the id. */
export function parseVimeoId(input: string): string | null {
  const s = input.trim();
  if (/^\d+$/.test(s)) return s;
  const m = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export type VimeoVideoInfo = {
  id: string;
  title: string;
  duration: number; // seconds
  status: string;   // "available" once transcoded
  privacy?: { view?: string; embed?: string };
};

export async function fetchVideoInfo(videoId: string): Promise<VimeoVideoInfo | null> {
  const r = await fetch(`${API_BASE}/videos/${encodeURIComponent(videoId)}`, {
    headers: {
      Authorization: `bearer ${accessToken()}`,
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
    cache: "no-store",
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Vimeo fetch failed: ${r.status}`);
  const j: any = await r.json();
  return {
    id: String(videoId),
    title: j.name ?? "",
    duration: Math.floor(j.duration ?? 0),
    status: j.status ?? "unknown",
    privacy: j.privacy,
  };
}

/** Verify the access token works. Hits the cheapest endpoint available. */
export async function pingVimeo(): Promise<boolean> {
  const r = await fetch(`${API_BASE}/me`, {
    headers: {
      Authorization: `bearer ${accessToken()}`,
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
    cache: "no-store",
  });
  return r.ok;
}

/**
 * Build the player embed URL. No signing — Vimeo enforces access via
 * domain whitelist (set per-video in the Vimeo dashboard), so the iframe
 * only renders on our site.
 */
export function embedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${encodeURIComponent(videoId)}?title=0&byline=0&portrait=0&dnt=1`;
}
