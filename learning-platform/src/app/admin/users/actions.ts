"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";

export async function createUser(formData: FormData) {
  await requireAdmin();
  const login_id = String(formData.get("login_id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "student") === "admin" ? "admin" : "student";
  if (!login_id || !name || !password) return;
  const password_hash = await hashPassword(password);
  await db().from("users").insert({ login_id, name, password_hash, role, status: "active" });
  revalidatePath("/admin/users");
}

export async function setStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) === "dormant" ? "dormant" : "active";
  await db()
    .from("users")
    .update({
      status,
      dormant_at: status === "dormant" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  revalidatePath("/admin/users");
}

export async function resetPassword(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const password = String(formData.get("password") || "");
  if (!password) return;
  const password_hash = await hashPassword(password);
  await db().from("users").update({ password_hash }).eq("id", id);
  revalidatePath("/admin/users");
}
