"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function NavBar() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          inclass
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {status === "authenticated" && (
            <>
              <Link href="/workbooks" className="hover:underline">
                문제집
              </Link>
              {role === "ADMIN" && (
                <Link href="/admin" className="hover:underline">
                  관리자
                </Link>
              )}
              <span className="text-slate-500">
                {session.user.name} ({session.user.username})
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-700"
              >
                로그아웃
              </button>
            </>
          )}
          {status === "unauthenticated" && (
            <Link
              href="/login"
              className="rounded bg-slate-900 px-3 py-1 text-white hover:bg-slate-700"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
