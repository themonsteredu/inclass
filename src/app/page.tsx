import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/workbooks");

  const adminCount = await db.user.count({ where: { role: "ADMIN" } }).catch(() => 1);
  if (adminCount === 0) redirect("/bootstrap");

  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-3xl font-bold">inclass 강의 시스템</h1>
      <p className="mt-3 text-slate-600">
        문제집 → 문제 → 팁·개념·유형 강의를 수강하고, 수강 진도가 자동으로 기록됩니다.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block rounded bg-slate-900 px-5 py-2 text-white hover:bg-slate-700"
      >
        로그인하기
      </Link>
    </div>
  );
}
