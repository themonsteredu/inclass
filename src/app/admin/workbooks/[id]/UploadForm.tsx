"use client";

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

    const duration = await readVideoDuration(file).catch(() => 0);

    const form = new FormData();
    form.set("problemId", problemId);
    form.set("type", type);
    form.set("title", title.trim());
    form.set("duration", String(Math.floor(duration)));
    form.set("file", file);

    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      setError("업로드 실패");
      return;
    }
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2">
      <input
        className="w-full rounded border px-2 py-1 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="강의 제목"
      />
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="w-full text-xs"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        disabled={uploading}
        className="w-full rounded bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {uploading ? "업로드 중..." : existingTitle ? "교체 업로드" : "업로드"}
      </button>
    </form>
  );
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
