import { pingVimeo } from "@/lib/vimeo";

export const dynamic = "force-dynamic";

export default async function VimeoStatusPage() {
  let ok = false;
  let err: string | null = null;
  try {
    ok = await pingVimeo();
  } catch (e: any) {
    err = e?.message ?? String(e);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Vimeo 연결 상태</h1>
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
          연결이 안 되면 Vercel 환경변수에 <code>VIMEO_ACCESS_TOKEN</code> 이 정확히
          들어있는지 확인하세요. README의 "Vimeo 셋업" 섹션을 참고해 주세요.
        </p>
        <p className="text-xs text-gray-500">
          영상 보안은 Vimeo 대시보드에서 각 영상의 Privacy를 <b>"Hide from Vimeo"</b> 로
          설정하고, Embed Privacy의 도메인 화이트리스트에 우리 사이트 주소를 추가하면
          됩니다 (Plus 플랜 이상에서 지원).
        </p>
      </div>
    </div>
  );
}
