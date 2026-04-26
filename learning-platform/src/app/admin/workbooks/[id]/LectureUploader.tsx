"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LectureUploader({
  problemId,
  kind,
  initialVideoId,
}: {
  problemId: string;
  kind: "tip" | "concept" | "type";
  initialVideoId?: string | null;
}) {
  const router = useRouter();
  const [videoId, setVideoId] = useState(initialVideoId ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!videoId.trim()) return;
    setBusy(true);
    setMsg("Vimeo에서 영상 정보를 가져오는 중…");
    const res = await fetch("/api/lectures/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem_id: problemId, kind, video_id: videoId.trim() }),
    });
    if (res.ok) {
      setMsg("등록 완료");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setMsg("실패: " + (j.error ?? res.status));
    }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="mt-2 space-y-1">
      <input
        type="text"
        value={videoId}
        onChange={(e) => setVideoId(e.target.value)}
        placeholder="Vimeo 영상 ID 또는 URL (예: 123456789 또는 https://vimeo.com/123456789)"
        className="field text-xs font-mono"
        disabled={busy}
      />
      <button className="btn-ghost text-xs" type="submit" disabled={busy || !videoId.trim()}>
        {initialVideoId ? "교체" : "등록"}
      </button>
      {msg && <div className="text-xs text-gray-500">{msg}</div>}
    </form>
  );
}
