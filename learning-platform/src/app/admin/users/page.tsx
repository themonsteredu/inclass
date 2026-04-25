import { db } from "@/lib/db";
import { createUser, resetPassword, setStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { data: users } = await db()
    .from("users")
    .select("id,login_id,name,role,status,dormant_at,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">학생 계정</h1>

      <form action={createUser} className="card p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="label">아이디</label>
          <input name="login_id" className="field" required />
        </div>
        <div>
          <label className="label">이름</label>
          <input name="name" className="field" required />
        </div>
        <div>
          <label className="label">초기 비밀번호</label>
          <input name="password" className="field" required />
        </div>
        <div>
          <label className="label">역할</label>
          <select name="role" className="field" defaultValue="student">
            <option value="student">학생</option>
            <option value="admin">관리자</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full" type="submit">계정 생성</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>아이디</th>
              <th>이름</th>
              <th>역할</th>
              <th>상태</th>
              <th>가입일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="font-mono">{u.login_id}</td>
                <td>{u.name}</td>
                <td>{u.role === "admin" ? "관리자" : "학생"}</td>
                <td>
                  {u.status === "active" ? (
                    <span className="text-green-700">활성</span>
                  ) : (
                    <span className="text-gray-500">휴면</span>
                  )}
                </td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="flex gap-2 flex-wrap">
                  <form action={setStatus}>
                    <input type="hidden" name="id" value={u.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={u.status === "active" ? "dormant" : "active"}
                    />
                    <button className="btn-ghost" type="submit">
                      {u.status === "active" ? "휴면 처리" : "복귀"}
                    </button>
                  </form>
                  <form action={resetPassword} className="flex gap-1">
                    <input type="hidden" name="id" value={u.id} />
                    <input
                      name="password"
                      placeholder="새 비밀번호"
                      className="field !w-32"
                      required
                    />
                    <button className="btn-ghost" type="submit">재설정</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
