# inclass — 학원 강의 시스템

문제집 → 문제 → (팁강의 · 개념강의 · 유형강의) 구조로 동영상 강의를 제공하고,
학생별 로그인·접근 권한·시청 진도 추적을 지원하는 Next.js 앱입니다.

## 핵심 기능

- **학생 로그인** (아이디/비밀번호) — 관리자가 발급한 계정만 접속 가능
- **문제집 단위 접근 권한** — 관리자가 "이 학생은 이 문제집 볼 수 있음"을 체크
- **자체 영상 업로드** — Vercel Blob 직접 업로드 (최대 2GB/파일)
- **진도 자동 기록** — 10초마다 서버 저장, 이탈 시 `sendBeacon` 플러시
- **관리자 대시보드**
  - 콘텐츠 관리 (문제집/문제/3종 강의 업로드)
  - 학생 계정 관리 (등록·비밀번호 재설정·삭제)
  - **강의 접근 권한** (학생별 문제집 배정)
  - **수강 현황** (학생별/강의별 시청 시간·진행률·완료 여부)

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Prisma + **Postgres**
- **Vercel Blob** (동영상 저장 + CDN)
- NextAuth.js (JWT 세션)
- Tailwind CSS

---

## Vercel 배포 가이드 (초심자용)

이 과정만 따라오시면 인터넷에 배포되고, 학원 학생들이 접속해서 사용할 수 있습니다.
필요한 것: **GitHub 계정**, **Vercel 계정** (둘 다 무료).

### 1. Vercel에 프로젝트 임포트

1. https://vercel.com/new 접속 → 로그인
2. "Import Git Repository"에서 **이 리포지토리** 선택
3. Branch는 `claude/lecture-system-with-tracking-7qQQR` (또는 main에 병합 후 main)
4. 일단 **Deploy 버튼은 누르지 말고** 아래 2번으로

### 2. Postgres 데이터베이스 연결

1. Vercel 대시보드 → 방금 만든 프로젝트 → **Storage 탭**
2. **Create Database** → **Postgres** 선택 → 이름 입력 → Create
3. 생성 후 "Connect to Project" 클릭 → **모든 환경(Production/Preview/Development) 체크** → Connect
4. 이렇게 하면 `DATABASE_URL` 등 환경 변수가 자동으로 프로젝트에 주입됩니다.

### 3. Blob 스토리지(영상 저장소) 연결

1. 같은 **Storage 탭** → **Create Database** → **Blob** 선택 → 이름 입력 → Create
2. "Connect to Project" → 모든 환경 체크 → Connect
3. `BLOB_READ_WRITE_TOKEN` 환경 변수가 자동 추가됩니다.

### 4. NEXTAUTH_SECRET 추가

1. 터미널(또는 https://generate-secret.vercel.app/32 같은 사이트)에서 랜덤 문자열 생성
2. Vercel 프로젝트 → **Settings → Environment Variables**
3. 이름: `NEXTAUTH_SECRET`, 값: 위에서 만든 문자열, 모든 환경 체크 → Save

### 5. 배포

1. 프로젝트의 **Deployments 탭** → 최근 항목의 "⋯" → **Redeploy**
   (또는 GitHub에 커밋을 하나 더 푸시하면 자동 배포)
2. 완료되면 `https://프로젝트이름.vercel.app` 주소 확인

### 6. 최초 관리자 계정 생성

1. 배포된 주소 그대로 접속
2. 자동으로 `/bootstrap` 페이지로 이동합니다. (관리자가 없을 때만)
3. 아이디/이름/비밀번호 입력 → 관리자 계정 생성 → 자동 로그인

### 7. 학원 운영 시작

관리자 대시보드에서 다음 순서로 세팅:

1. **문제집/문제/강의 관리** — 문제집과 문제를 만들고, 각 문제에 팁/개념/유형 강의 영상 업로드
2. **학생 계정 관리** — 학생들의 아이디/이름/초기 비밀번호 등록
3. **강의 접근 권한** — 각 학생에게 어떤 문제집을 볼 수 있는지 체크
4. **수강 현황** — 학생들이 시청하기 시작하면 진도가 자동 누적됨

학생들에게는 `https://프로젝트이름.vercel.app/login` 주소와 개인 아이디/비밀번호를 알려주시면 됩니다.

---

## 요금 참고 (Vercel 무료 Hobby 플랜 기준)

| 자원        | 무료 한도             | 비고                                      |
|------------|-----------------------|-------------------------------------------|
| Blob 저장  | 1 GB                  | 영상 총 1GB까지. 부족하면 Pro($20/월) 또는 외부 S3 |
| Blob 대역폭 | 10 GB/월              | 시청량이 많으면 Pro 필요                  |
| Postgres   | 256 MB + 충분한 row   | 이 시스템엔 여유롭게 충분                  |
| Functions  | 서버리스 요청 수 넉넉 | 강의 시청 자체는 Blob CDN에서 직접 서빙됨 |

영상 용량이 커질 것 같으면 Pro($20/월) 업그레이드 또는 Cloudflare R2 / AWS S3로
업로드 대상만 바꾸면 됩니다 (코드 변경은 업로드 2파일만).

---

## 로컬 개발 (선택)

Vercel에 올리지 않고 본인 PC에서 돌려보고 싶을 때:

```bash
git clone <this repo>
cd inclass
npm install

# .env 파일 만들고 아래 값 채우기
# DATABASE_URL=... (Postgres, 예: Neon 무료 티어)
# NEXTAUTH_SECRET=...
# BLOB_READ_WRITE_TOKEN=... (로컬 테스트에서도 Vercel Blob 사용)

npx prisma migrate dev --name init
npm run dev
```

http://localhost:3000 → `/bootstrap`에서 최초 관리자 생성.

---

## 주요 경로

| 경로 | 역할 |
|-----|------|
| `/bootstrap` | 관리자가 없을 때만 열리는 최초 관리자 생성 |
| `/login` | 로그인 |
| `/workbooks` | 학생에게 배정된 문제집 목록 |
| `/problems/[id]` | 팁·개념·유형 3종 강의 카드 |
| `/lectures/[id]` | 비디오 재생 + 진도 추적 |
| `/admin` | 관리자 대시보드 |
| `/admin/workbooks` | 콘텐츠 관리 + 영상 업로드 |
| `/admin/users` | 계정 관리 |
| `/admin/enrollments` | 학생별 강의 접근 권한 |
| `/admin/analytics` | 수강 현황 |

## 보안 메모

- 영상 URL은 "공개이지만 추측 불가능한 URL" 방식입니다. 강력한 DRM이 필요하면
  서명 URL 공급자(예: Cloudflare Stream, Mux)로 업로드 2파일만 교체하세요.
- 로그인 쿠키는 `HttpOnly + Secure`로 발급됩니다 (Vercel HTTPS 필수).
