"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function MarkDoneButton({ problemId, done }: { problemId: string; done: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className={done ? "btn-ghost" : "btn-primary"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch("/api/problems/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ problem_id: problemId, done: !done }),
          });
          router.refresh();
        })
      }
    >
      {done ? "완료 취소" : "완료로 표시"}
    </button>
  );
}
