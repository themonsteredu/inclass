import Link from "next/link";
import { loadStoredTokens } from "@/lib/drive";

export const dynamic = "force-dynamic";

export default async function DrivePage() {
  const t = await loadStoredTokens();
  const connected = !!t?.refresh_token;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Google Drive 연동</h1>
      <div className="card p-4 space-y-3">
        <div>
          상태:{" "}
          {connected ? (
            <span className="text-green-700 font-medium">연결됨</span>
          ) : (
            <span className="text-red-600 font-medium">미연결</span>
          )}
        </div>
        <p className="text-sm text-gray-600">
          학원 영상을 보관할 구글 계정으로 로그인하세요. 이 계정의 Drive(5TB)가 영상 저장소가 됩니다.
          영상 파일은 본인 계정 비공개로 유지되고, 학생은 시스템을 통해서만 시청할 수 있습니다.
        </p>
        <Link className="btn-primary inline-block" href="/api/drive/oauth/start">
          {connected ? "다시 연결" : "Google 계정 연결"}
        </Link>
      </div>
    </div>
  );
}
