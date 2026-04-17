import { requireAdmin } from "@/lib/guards";
import { db } from "@/lib/db";
import { createUser, deleteUser, resetPassword } from "../actions";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">사용자 관리</h1>

      <form
        action={createUser}
        className="mb-6 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-5"
      >
        <input
          name="username"
          placeholder="아이디"
          required
          className="rounded border px-3 py-2"
        />
        <input
          name="name"
          placeholder="이름"
          required
          className="rounded border px-3 py-2"
        />
        <input
          name="password"
          type="text"
          placeholder="초기 비밀번호"
          required
          minLength={6}
          className="rounded border px-3 py-2"
        />
        <select name="role" className="rounded border px-3 py-2">
          <option value="STUDENT">학생</option>
          <option value="ADMIN">관리자</option>
        </select>
        <button className="rounded bg-slate-900 px-3 py-2 text-white hover:bg-slate-700">
          등록
        </button>
      </form>

      <table className="w-full overflow-hidden rounded-lg border bg-white text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-3 py-2">아이디</th>
            <th className="px-3 py-2">이름</th>
            <th className="px-3 py-2">권한</th>
            <th className="px-3 py-2">가입일</th>
            <th className="px-3 py-2">비밀번호 재설정</th>
            <th className="px-3 py-2">삭제</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="px-3 py-2 font-mono">{u.username}</td>
              <td className="px-3 py-2">{u.name}</td>
              <td className="px-3 py-2">
                {u.role === "ADMIN" ? "관리자" : "학생"}
              </td>
              <td className="px-3 py-2 text-slate-500">
                {u.createdAt.toISOString().slice(0, 10)}
              </td>
              <td className="px-3 py-2">
                <form action={resetPassword} className="flex gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <input
                    name="password"
                    type="text"
                    placeholder="새 비밀번호"
                    minLength={6}
                    className="w-36 rounded border px-2 py-1"
                  />
                  <button className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300">
                    변경
                  </button>
                </form>
              </td>
              <td className="px-3 py-2">
                <form action={deleteUser}>
                  <input type="hidden" name="id" value={u.id} />
                  <button className="text-xs text-red-600 hover:underline">
                    삭제
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
