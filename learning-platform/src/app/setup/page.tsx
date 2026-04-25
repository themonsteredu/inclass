import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

async function createAdmin(formData: FormData) {
  "use server";
  const token = String(formData.get("token") || "");
  if (token !== process.env.SETUP_TOKEN || !process.env.SETUP_TOKEN) {
    redirect("/setup?error=" + encodeURIComponent("SETUP_TOKEN 불일치"));
  }
  const login_id = String(formData.get("login_id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  if (!login_id || !name || !password) {
    redirect("/setup?error=" + encodeURIComponent("모든 항목 입력"));
  }
  const { count } = await db().from("users").select("*", { count: "exact", head: true }).eq("role", "admin");
  if ((count ?? 0) > 0) {
    redirect("/login");
  }
  const password_hash = await hashPassword(password);
  await db().from("users").insert({
    login_id, name, password_hash, role: "admin", status: "active",
  });
  redirect("/login");
}

export default async function SetupPage({ searchParams }: { searchParams: { error?: string } }) {
  const { count } = await db().from("users").select("*", { count: "exact", head: true }).eq("role", "admin");
  if ((count ?? 0) > 0) {
    redirect("/login");
  }
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form action={createAdmin} className="card p-6 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">최초 관리자 생성</h1>
        {searchParams?.error && <p className="text-sm text-red-600">{searchParams.error}</p>}
        <div><label className="label">SETUP_TOKEN</label><input name="token" className="field" required /></div>
        <div><label className="label">아이디</label><input name="login_id" className="field" required /></div>
        <div><label className="label">이름</label><input name="name" className="field" required /></div>
        <div><label className="label">비밀번호</label><input name="password" type="password" className="field" required /></div>
        <button className="btn-primary w-full" type="submit">생성</button>
      </form>
    </main>
  );
}
