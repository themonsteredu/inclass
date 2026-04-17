"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Props = {
  problemId: string;
  type: "TIP" | "CONCEPT" | "PATTERN";
  existingTitle?: string | null;
};

export function UploadForm({ problemId, type, existingTitle }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(existingTitle ?? "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim()) {
      setError("제목과 파일이 필요합니다.");
      return;
    }
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const duration = await readVideoDuration(file).catch(() => 0);

      const blob = await upload(
        `lectures/${problemId}/${type}-${Date.now()}-${sanitize(file.name)}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/admin/blob-upload",
          contentType: file.type || "video/mp4",
          onUploadProgress: (p) => setProgress(Math.round(p.percentage)),
        },
      );

      const res = await fetch("/api/admin/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          type,
          title: title.trim(),
          url: blob.url,
          mimeType: file.type || "video/mp4",
          sizeBytes: file.size,
          duration: Math.floor(duration),
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "강의 등록 실패");
      }

      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2">
      <input
        className="w-full rounded border px-2 py-1 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="강의 제목"
      />
      <input ref={fileRef} type="file" accept="video/*" className="w-full text-xs" />
      {uploading && (
        <div className="h-1 w-full overflow-hidden rounded bg-slate-200">
          <div
            className="h-full bg-slate-900 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        disabled={uploading}
        className="w-full rounded bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {uploading
          ? `업로드 중 ${progress}%`
          : existingTitle
            ? "교체 업로드"
            : "업로드"}
      </button>
    </form>
  );
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration || 0);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("failed to read metadata"));
    };
    v.src = url;
  });
}
