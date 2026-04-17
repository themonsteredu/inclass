"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";

const WorkbookInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  order: z.coerce.number().int().min(0).default(0),
});

export async function createWorkbook(formData: FormData) {
  await requireAdmin();
  const parsed = WorkbookInput.parse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    order: formData.get("order") || 0,
  });
  await db.workbook.create({ data: parsed });
  revalidatePath("/admin/workbooks");
}

export async function deleteWorkbook(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.workbook.delete({ where: { id } });
  revalidatePath("/admin/workbooks");
}

const ProblemInput = z.object({
  workbookId: z.string().min(1),
  number: z.coerce.number().int().min(1),
  title: z.string().min(1).max(200),
});

export async function createProblem(formData: FormData) {
  await requireAdmin();
  const parsed = ProblemInput.parse({
    workbookId: formData.get("workbookId"),
    number: formData.get("number"),
    title: formData.get("title"),
  });
  await db.problem.create({ data: parsed });
  revalidatePath(`/admin/workbooks/${parsed.workbookId}`);
}

export async function deleteProblem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const problem = await db.problem.findUnique({ where: { id } });
  if (!problem) return;
  await db.problem.delete({ where: { id } });
  revalidatePath(`/admin/workbooks/${problem.workbookId}`);
}

const UserInput = z.object({
  username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
  name: z.string().min(1).max(80),
  password: z.string().min(6).max(80),
  role: z.enum(["STUDENT", "ADMIN"]).default("STUDENT"),
});

export async function createUser(formData: FormData) {
  await requireAdmin();
  const parsed = UserInput.parse({
    username: formData.get("username"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role") || "STUDENT",
  });
  const passwordHash = await bcrypt.hash(parsed.password, 10);
  await db.user.create({
    data: {
      username: parsed.username,
      name: parsed.name,
      passwordHash,
      role: parsed.role,
    },
  });
  revalidatePath("/admin/users");
}

export async function resetPassword(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 6) return;
  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.update({ where: { id }, data: { passwordHash } });
  revalidatePath("/admin/users");
}

export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}
