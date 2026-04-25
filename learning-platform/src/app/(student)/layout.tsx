import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <div className="font-semibold">학습 플랫폼</div>
        <nav className="flex gap-3 text-sm">
          <Link className="hover:underline" href="/today">오늘 할 분량</Link>
          <Link className="hover:underline" href="/calendar">달력</Link>
          <Link className="hover:underline" href="/roadmap">2년 로드맵</Link>
          <Link className="hover:underline" href="/workbooks">문제집</Link>
        </nav>
        <div className="ml-auto text-sm text-gray-500">
          {u.name} · <a className="underline" href="/api/auth/logout">로그아웃</a>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">{children}</main>
    </div>
  );
}
