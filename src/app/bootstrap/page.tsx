import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BootstrapForm } from "./BootstrapForm";

export const dynamic = "force-dynamic";

export default async function BootstrapPage() {
  const adminCount = await db.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) {
    redirect("/login");
  }
  return (
    <div className="mx-auto max-w-sm rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-xl font-semibold">최초 관리자 계정 생성</h1>
      <p className="mb-4 text-sm text-slate-600">
        시스템에 관리자 계정이 없습니다. 이 페이지에서 관리자를 1명 만들어 주세요.
        (한 번 생성 후에는 이 페이지가 더 이상 열리지 않습니다.)
      </p>
      <BootstrapForm />
    </div>
  );
}
