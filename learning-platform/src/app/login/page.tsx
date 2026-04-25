import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form action={login} className="card p-6 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">로그인</h1>
        {searchParams?.error && (
          <p className="text-sm text-red-600">{searchParams.error}</p>
        )}
        <div>
          <label className="label" htmlFor="login_id">아이디</label>
          <input id="login_id" name="login_id" className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" className="field" required />
        </div>
        <button className="btn-primary w-full" type="submit">로그인</button>
      </form>
    </main>
  );
}
