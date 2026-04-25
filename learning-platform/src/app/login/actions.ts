"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

export async function login(formData: FormData) {
  const login_id = String(formData.get("login_id") || "").trim();
  const password = String(formData.get("password") || "");
  if (!login_id || !password) {
    redirect("/login?error=" + encodeURIComponent("아이디와 비밀번호를 입력하세요"));
  }
  const { data: user } = await db()
    .from("users")
    .select("id,login_id,name,role,status,password_hash")
    .eq("login_id", login_id)
    .maybeSingle();
  if (!user) {
    redirect("/login?error=" + encodeURIComponent("아이디 또는 비밀번호가 올바르지 않습니다"));
  }
  if (user!.status === "dormant") {
    redirect("/login?error=" + encodeURIComponent("휴면 상태 계정입니다. 학원에 문의하세요"));
  }
  const ok = await verifyPassword(password, user!.password_hash);
  if (!ok) {
    redirect("/login?error=" + encodeURIComponent("아이디 또는 비밀번호가 올바르지 않습니다"));
  }
  await setSessionCookie({
    id: user!.id,
    login_id: user!.login_id,
    name: user!.name,
    role: user!.role,
  });
  redirect(user!.role === "admin" ? "/admin" : "/today");
}
