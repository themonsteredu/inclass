// Bunny.net Stream — minimal client.
//
// Three things we need:
//  1) fetch video metadata (length, status) by GUID
//  2) sign a short-lived embed URL so the player only works for logged-in students
//  3) sanity-check the API key (used by /admin/bunny status page)

import { createHash } from "crypto";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function libraryId(): string {
  return env("BUNNY_LIBRARY_ID");
}

function apiKey(): string {
  return env("BUNNY_API_KEY");
}

function tokenAuthKey(): string {
  return env("BUNNY_TOKEN_AUTH_KEY");
}

export type BunnyVideoInfo = {
  guid: string;
  title: string;
  length: number;             // seconds
  status: number;             // 0..5 (4 = ready)
  thumbnailFileName?: string;
};

export async function fetchVideoInfo(videoId: string): Promise<BunnyVideoInfo | null> {
  const r = await fetch(
    `https://video.bunnycdn.com/library/${libraryId()}/videos/${encodeURIComponent(videoId)}`,
    { headers: { AccessKey: apiKey(), accept: "application/json" }, cache: "no-store" }
  );
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Bunny fetch failed: ${r.status}`);
  return (await r.json()) as BunnyVideoInfo;
}

/** Verify the API key works without consuming much quota. */
export async function pingLibrary(): Promise<boolean> {
  const r = await fetch(
    `https://video.bunnycdn.com/library/${libraryId()}/videos?page=1&itemsPerPage=1`,
    { headers: { AccessKey: apiKey() }, cache: "no-store" }
  );
  return r.ok;
}

/**
 * Build a short-lived signed embed URL. Bunny.net's token auth verifies the
 * hash on every request, so even if a student copies the iframe URL, it stops
 * working after `expiresInSec`.
 *
 * Token auth must be enabled in the library settings; the security key shown
 * there goes into BUNNY_TOKEN_AUTH_KEY.
 */
export function signEmbedUrl(videoId: string, expiresInSec: number = 60 * 60 * 4): string {
  const expires = Math.floor(Date.now() / 1000) + expiresInSec;
  const hash = createHash("sha256")
    .update(tokenAuthKey() + videoId + expires)
    .digest("hex");
  const lid = libraryId();
  return `https://iframe.mediadelivery.net/embed/${lid}/${encodeURIComponent(videoId)}?token=${hash}&expires=${expires}&autoplay=false`;
}
