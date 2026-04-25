"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LectureUploader({
  problemId,
  kind,
}: {
  problemId: string;
  kind: "tip" | "concept" | "type";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setMsg("업로드 중…");
    const fd = new FormData();
    fd.append("file", f);
    fd.append("problem_id", problemId);
    fd.append("kind", kind);
    const res = await fetch("/api/drive/upload", { method: "POST", body: fd });
    if (res.ok) {
      setMsg("완료");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setMsg("실패: " + (j.error ?? res.status));
    }
    setBusy(false);
  }

  return (
    <div className="mt-2">
      <input type="file" accept="video/*" onChange={onChange} disabled={busy} className="text-xs" />
      {msg && <div className="text-xs mt-1 text-gray-500">{msg}</div>}
    </div>
  );
}
