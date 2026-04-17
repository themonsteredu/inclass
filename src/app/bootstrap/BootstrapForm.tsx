"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BootstrapForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, name, password }),
    });
    if (!res.ok) {
      setLoading(false);
      const msg = await res.text().catch(() => "");
      setError(msg || "생성 실패");
      return;
    }
    const signin = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (signin?.error) {
      setError("계정은 생성되었으나 자동 로그인에 실패했습니다. /login 에서 수동 로그인해 주세요.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm text-slate-700">아이디</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          pattern="[a-zA-Z0-9._-]+"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-700">이름</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-700">비밀번호 (6자 이상)</label>
        <input
          type="password"
          className="w-full rounded border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-slate-900 px-3 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? "생성 중..." : "관리자 계정 생성"}
      </button>
    </form>
  );
}
