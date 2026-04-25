import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await requireAdmin();
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-white border-r border-gray-200 p-4 flex flex-col">
        <div className="text-base font-semibold mb-4">관리자</div>
        <nav className="space-y-1 text-sm">
          <Link className="block px-2 py-1.5 rounded hover:bg-gray-100" href="/admin">대시보드</Link>
          <Link className="block px-2 py-1.5 rounded hover:bg-gray-100" href="/admin/users">학생 계정</Link>
          <Link className="block px-2 py-1.5 rounded hover:bg-gray-100" href="/admin/workbooks">문제집/강의</Link>
          <Link className="block px-2 py-1.5 rounded hover:bg-gray-100" href="/admin/roadmaps">2년 로드맵</Link>
          <Link className="block px-2 py-1.5 rounded hover:bg-gray-100" href="/admin/plans">학습 플랜</Link>
          <Link className="block px-2 py-1.5 rounded hover:bg-gray-100" href="/admin/analytics">분석</Link>
          <Link className="block px-2 py-1.5 rounded hover:bg-gray-100" href="/admin/bunny">Bunny.net 상태</Link>
        </nav>
        <div className="mt-auto pt-4 text-xs text-gray-500">
          <div>{u.name} (관리자)</div>
          <a href="/api/auth/logout" className="underline">로그아웃</a>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
