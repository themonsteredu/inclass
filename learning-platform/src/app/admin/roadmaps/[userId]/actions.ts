"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function ensureRoadmap(formData: FormData) {
  await requireAdmin();
  const user_id = String(formData.get("user_id"));
  const start_date = String(formData.get("start_date"));
  const end_date = String(formData.get("end_date"));
  if (!user_id || !start_date || !end_date) return;
  const supa = db();
  const { data: existing } = await supa.from("roadmaps").select("id").eq("user_id", user_id).maybeSingle();
  if (existing) {
    await supa.from("roadmaps").update({ start_date, end_date }).eq("id", existing.id);
  } else {
    await supa.from("roadmaps").insert({ user_id, start_date, end_date });
  }
  revalidatePath(`/admin/roadmaps/${user_id}`);
}

export async function addItem(formData: FormData) {
  await requireAdmin();
  const user_id = String(formData.get("user_id"));
  const roadmap_id = String(formData.get("roadmap_id"));
  const workbook_id = String(formData.get("workbook_id"));
  const target_start = String(formData.get("target_start"));
  const target_end = String(formData.get("target_end"));
  if (!roadmap_id || !workbook_id || !target_start || !target_end) return;
  const supa = db();
  const { count } = await supa
    .from("roadmap_items")
    .select("*", { count: "exact", head: true })
    .eq("roadmap_id", roadmap_id);
  await supa
    .from("roadmap_items")
    .insert({ roadmap_id, workbook_id, target_start, target_end, position: count ?? 0 });
  revalidatePath(`/admin/roadmaps/${user_id}`);
}

export async function deleteItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const user_id = String(formData.get("user_id"));
  await db().from("roadmap_items").delete().eq("id", id);
  revalidatePath(`/admin/roadmaps/${user_id}`);
}
