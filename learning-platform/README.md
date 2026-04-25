# learning-platform

Next.js 14 + Supabase + Google Drive 기반 학원 강의/진도 시스템.

- 학생 계정 (아이디·비밀번호, **휴면 처리** 지원)
- 문제집 → 문제 → 팁/개념/유형 강의 (Drive에 업로드)
- **2년 로드맵** 학생별 편집
- **학습 플랜 자동분배** — 시작·종료·요일·하루 시간 입력 → 일별 분량 자동 생성
- 학생 화면: **오늘 할 분량**, **달력 뷰** (월간 진척률·연체 표시), 2년 로드맵 보기
- 분석: 진척률, **팁 의존도** (팁 클릭률 + 팁 재시청 평균)

> 일요일은 자동분배에서 기본 제외. 요일 마스크는 학습 플랜마다 따로 지정 가능.

---

## 1. Supabase 준비

1. <https://supabase.com> 에서 무료 프로젝트 생성
2. **Settings → API** 에서 다음 키 확인:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (서버에서만 사용, 외부 노출 금지)
3. **SQL Editor** 에서 `supabase/migrations/0001_init.sql` 전체를 붙여넣고 실행

## 2. Google OAuth (Drive) 준비

1. <https://console.cloud.google.com/apis/credentials> 에서 새 프로젝트 → OAuth 동의 화면 구성 (외부 / 테스트 단계 OK)
2. **사용자 인증 정보 → OAuth 클라이언트 ID** → 웹 애플리케이션
3. 승인된 리디렉션 URI:
   - `http://localhost:3000/api/drive/oauth/callback`
   - 배포 후 `https://<도메인>/api/drive/oauth/callback` 도 추가
4. **API 라이브러리** 에서 *Google Drive API* 사용 설정
5. 발급된 Client ID / Secret을 `.env` 에 입력

## 3. 로컬 실행

```bash
cd learning-platform
cp .env.example .env
# .env 의 값들 채우기 (Supabase, SESSION_SECRET, SETUP_TOKEN, GOOGLE_*)

npm install
npm run dev
```

브라우저: <http://localhost:3000/setup> → SETUP_TOKEN과 함께 최초 관리자 생성 → `/login` 으로 이동.

관리자 로그인 후:
1. **Drive 연동** 메뉴 → "Google 계정 연결" → 5TB 계정 인증
2. **학생 계정** → 학생 등록
3. **문제집/강의** → 문제집·문제 추가 → 각 문제에 팁/개념/유형 영상 업로드
4. **2년 로드맵** → 학생별 시작·종료일과 단계별 문제집·기간 등록
5. **학습 플랜** → 학생·문제집·요일·기간·하루시간 입력 → 자동분배
   - 자동분배 결과는 *플랜 상세*에서 일별로 수동 편집 가능 (편집 시 모드가 *수동* 으로 전환)

학생 로그인 후:
- `/today` 오늘 분량 카드
- `/calendar` 월간 달력 (지난 날짜에 미완료 → 빨간색)
- `/roadmap` 2년 로드맵
- `/workbooks/[id]` → `/problems/[id]` → 강의 재생

## 4. Vercel 배포

1. 이 폴더(`learning-platform/`)를 GitHub repo 루트로 분리하거나, monorepo면 Vercel 프로젝트 설정에서 **Root Directory = `learning-platform`** 으로 지정
2. Vercel 환경변수에 `.env.example` 항목 그대로 입력
3. `APP_URL` 은 Vercel 도메인(`https://<project>.vercel.app`)
4. Google OAuth 콘솔에 동일 도메인의 callback URI 등록

## 5. 자동분배 알고리즘 메모

- 입력: `(start_date, end_date, weekdays_mask, problem_ids[])`
- 학습 가능 일수 D = 범위 안에서 mask에 해당하는 요일의 날 수
- 각 학습일에 `floor(N/D)` 개 + 앞쪽 `N mod D` 개 일에 +1
- 문제는 번호순으로 앞에서부터 차례로 할당

학생이 그날 분량을 못 끝내도 다음 날로 누적되지 않습니다. 달력에서 빨간색으로 표시되고, 진척률에는 그대로 반영됩니다.

## 6. 보안 메모

- 영상 파일은 관리자 본인 Drive 계정에 비공개 보관됩니다. 학생은 시스템을 거쳐 iframe `preview` URL 로만 시청합니다.
- 학생 비밀번호는 bcrypt로 해시 저장, 세션은 HttpOnly + Secure 쿠키 + JWT(30일).
- 매 요청마다 `users.status='dormant'` 인 계정의 세션은 무효화됩니다.
- 모든 관리자 액션은 `requireAdmin()` 로 권한 검사.

## 7. 폴더 구조

```
learning-platform/
├─ src/
│  ├─ app/
│  │  ├─ (student)/      # 학생용 라우트 (today, calendar, roadmap, workbooks, problems, lectures)
│  │  ├─ admin/          # 관리자 라우트 (users, workbooks, roadmaps, plans, analytics, drive)
│  │  ├─ api/            # 서버 라우트 (drive OAuth, upload, heartbeat, complete, logout)
│  │  ├─ login/, setup/  # 인증
│  │  └─ layout.tsx, page.tsx, globals.css
│  └─ lib/
│     ├─ auth.ts         # JWT + bcrypt + 휴면 체크
│     ├─ db.ts           # Supabase service-role 클라이언트
│     ├─ drive.ts        # OAuth + upload + duration
│     ├─ dates.ts        # 요일 비트마스크
│     └─ distribute.ts   # 자동분배 알고리즘
├─ supabase/migrations/0001_init.sql
├─ .env.example
└─ package.json
```
