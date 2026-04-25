import { pingLibrary } from "@/lib/bunny";

export const dynamic = "force-dynamic";

export default async function BunnyStatusPage() {
  let ok = false;
  let err: string | null = null;
  try {
    ok = await pingLibrary();
  } catch (e: any) {
    err = e?.message ?? String(e);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Bunny.net 연결 상태</h1>
      <div className="card p-4 space-y-2">
        <div>
          상태:{" "}
          {ok ? (
            <span className="text-green-700 font-medium">정상 연결</span>
          ) : (
            <span className="text-red-600 font-medium">연결 실패</span>
          )}
        </div>
        {err && <pre className="text-xs bg-gray-100 p-2 rounded">{err}</pre>}
        <p className="text-sm text-gray-600">
          연결이 안 되면 Vercel 환경변수에 <code>BUNNY_LIBRARY_ID</code>,
          <code> BUNNY_API_KEY</code>, <code>BUNNY_TOKEN_AUTH_KEY</code> 가 정확히 들어있는지 확인하세요.
          README의 "Bunny.net 셋업" 섹션을 참고해 주세요.
        </p>
      </div>
    </div>
  );
}
