"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function createWorkbook(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  if (!title) return;
  await db().from("workbooks").insert({ title, description });
  revalidatePath("/admin/workbooks");
}

export async function deleteWorkbook(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await db().from("workbooks").delete().eq("id", id);
  revalidatePath("/admin/workbooks");
}

export async function addProblem(formData: FormData) {
  await requireAdmin();
  const workbook_id = String(formData.get("workbook_id"));
  const number = Number(formData.get("number"));
  const title = String(formData.get("title") || "").trim() || null;
  if (!workbook_id || !number) return;
  await db().from("problems").insert({ workbook_id, number, title });
  revalidatePath(`/admin/workbooks/${workbook_id}`);
}

export async function deleteProblem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const workbook_id = String(formData.get("workbook_id"));
  await db().from("problems").delete().eq("id", id);
  revalidatePath(`/admin/workbooks/${workbook_id}`);
}
