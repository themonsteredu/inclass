"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LectureUploader({
  problemId,
  kind,
  initialGuid,
}: {
  problemId: string;
  kind: "tip" | "concept" | "type";
  initialGuid?: string | null;
}) {
  const router = useRouter();
  const [guid, setGuid] = useState(initialGuid ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!guid.trim()) return;
    setBusy(true);
    setMsg("Bunny에서 영상 정보를 가져오는 중…");
    const res = await fetch("/api/lectures/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem_id: problemId, kind, video_id: guid.trim() }),
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
        value={guid}
        onChange={(e) => setGuid(e.target.value)}
        placeholder="Bunny 영상 GUID (예: 4f3e... )"
        className="field text-xs font-mono"
        disabled={busy}
      />
      <button className="btn-ghost text-xs" type="submit" disabled={busy || !guid.trim()}>
        {initialGuid ? "교체" : "등록"}
      </button>
      {msg && <div className="text-xs text-gray-500">{msg}</div>}
    </form>
  );
}
