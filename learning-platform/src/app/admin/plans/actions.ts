"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { listToMask } from "@/lib/dates";
import { distributeProblems } from "@/lib/distribute";

export async function createPlan(formData: FormData) {
  await requireAdmin();
  const supa = db();
  const user_id = String(formData.get("user_id"));
  const workbook_id = String(formData.get("workbook_id"));
  const start_date = String(formData.get("start_date"));
  const end_date = String(formData.get("end_date"));
  const hours_per_day = Number(formData.get("hours_per_day") || 2);
  const wd = formData.getAll("wd").map((v) => Number(v));
  const weekdays_mask = listToMask(wd);
  if (!user_id || !workbook_id || !start_date || !end_date || !weekdays_mask) return;

  // load problems for the workbook in number order
  const { data: problems } = await supa
    .from("problems")
    .select("id,number")
    .eq("workbook_id", workbook_id)
    .order("number", { ascending: true });
  if (!problems || problems.length === 0) return;

  const dist = distributeProblems({
    startDate: new Date(start_date),
    endDate: new Date(end_date),
    weekdaysMask: weekdays_mask,
    problemIds: problems.map((p) => p.id),
  });

  const { data: plan, error } = await supa
    .from("study_plans")
    .insert({ user_id, workbook_id, source: "auto", start_date, end_date, weekdays_mask, hours_per_day })
    .select("id")
    .single();
  if (error || !plan) return;

  if (dist.length > 0) {
    const rows = dist.map((d) => ({
      plan_id: plan.id,
      date: d.date,
      problem_ids: d.problemIds,
    }));
    await supa.from("plan_days").insert(rows);
  }
  redirect(`/admin/plans/${plan.id}`);
}

export async function regenerate(formData: FormData) {
  await requireAdmin();
  const supa = db();
  const id = String(formData.get("id"));
  const { data: plan } = await supa
    .from("study_plans")
    .select("id,workbook_id,start_date,end_date,weekdays_mask")
    .eq("id", id)
    .single();
  if (!plan) return;
  const { data: problems } = await supa
    .from("problems")
    .select("id,number")
    .eq("workbook_id", plan.workbook_id)
    .order("number", { ascending: true });
  if (!problems) return;
  const dist = distributeProblems({
    startDate: new Date(plan.start_date),
    endDate: new Date(plan.end_date),
    weekdaysMask: plan.weekdays_mask,
    problemIds: problems.map((p) => p.id),
  });
  await supa.from("plan_days").delete().eq("plan_id", plan.id);
  if (dist.length > 0) {
    await supa.from("plan_days").insert(
      dist.map((d) => ({ plan_id: plan.id, date: d.date, problem_ids: d.problemIds }))
    );
  }
  await supa.from("study_plans").update({ source: "auto" }).eq("id", plan.id);
  revalidatePath(`/admin/plans/${plan.id}`);
}

export async function updateDay(formData: FormData) {
  await requireAdmin();
  const plan_id = String(formData.get("plan_id"));
  const date = String(formData.get("date"));
  const ids = String(formData.get("problem_ids") || "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  await db()
    .from("plan_days")
    .upsert({ plan_id, date, problem_ids: ids }, { onConflict: "plan_id,date" });
  await db().from("study_plans").update({ source: "manual" }).eq("id", plan_id);
  revalidatePath(`/admin/plans/${plan_id}`);
}

export async function deletePlan(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await db().from("study_plans").delete().eq("id", id);
  redirect("/admin/plans");
}
