import path from "node:path";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

export function resolveUploadPath(relative: string) {
  const resolved = path.resolve(UPLOAD_DIR, relative);
  if (!resolved.startsWith(UPLOAD_DIR + path.sep) && resolved !== UPLOAD_DIR) {
    throw new Error("Invalid path");
  }
  return resolved;
}
