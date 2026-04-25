# 학원 학습 플랫폼 — 셋업 가이드

이 가이드는 **개발 경험 없는 분**이 천천히 따라하면 1시간 안에 사이트를 띄울 수 있도록 만든 클릭 단위 안내서입니다.

> 사이트 구조: 영상은 **Bunny.net Stream**(영상 전용 CDN, 끊김 적고 보안 강함), 사이트 화면은 **Vercel**, 학생·문제집 데이터는 **Supabase**(데이터베이스). 다 무료/저가로 시작 가능.

---

## 0단계 — 미리 준비할 것

| 무엇 | 어디서 | 비용 |
|---|---|---|
| 결제 가능한 카드 | Bunny.net 결제용 | 시작 시 약 $5 충전(자동 차감) |
| 신용카드 등록할 수 있는 메일 | Vercel·Supabase 가입 | 0원 |
| 학원 이름 (영문) | 사이트 이름·도메인 후보 | 0원 |
| 도메인 (선택) | 가비아/카페24 등 | 연 5,500원~ (없어도 임시 vercel.app 주소로 시작 가능) |

**총 예상 시간**: 가입·셋업 60~90분 + 첫 영상 1개 등록 10분.

---

## 1단계 — 깃허브 계정 (10분)

이미 있다면 건너뛰세요.

1. <https://github.com/signup> 에서 가입
2. 이 리포를 받기 위해 **fork** 하거나, 기존 리포를 그대로 사용

---

## 2단계 — Supabase 만들기 (15분)

### 2-1. 가입과 프로젝트 생성

1. <https://supabase.com> → **Start your project**
2. GitHub 계정으로 로그인
3. **New project** 클릭
4. 입력:
   - Name: `inclass` (아무거나)
   - Database Password: **메모장에 따로 적어두세요** (한 번만 보여줍니다)
   - Region: **Northeast Asia (Seoul)** 또는 **Tokyo**
   - Plan: **Free**
5. Create new project → 약 2분 대기 (DB 생성)

### 2-2. 테이블 만들기

1. 좌측 메뉴 **SQL Editor** 클릭 → **New query**
2. 이 리포의 [`learning-platform/supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) 파일 내용을 **전체 복사** → 에디터에 붙여넣기
3. 우측 하단 **RUN** (또는 Cmd/Ctrl + Enter)
4. "Success. No rows returned" 가 보이면 성공

### 2-3. API 키 3개 메모

좌측 메뉴 **Settings → API** 들어가서 아래 3개를 메모장에 적어두세요:

| 화면에 보이는 이름 | 메모할 이름 |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role (Reveal 클릭) | `SUPABASE_SERVICE_ROLE_KEY` |

> service_role 키는 **절대 외부에 보여주면 안 됩니다.** 깃허브 등에 올라가지 않도록 주의.

---

## 3단계 — Bunny.net Stream 만들기 (15분)

영상이 들어갈 곳입니다. 학원 강의 사이트는 보통 이런 영상 CDN을 씁니다.

### 3-1. 가입

1. <https://bunny.net> → **Start free trial** (카드 등록 필요, 시작 시 $5 충전)
2. 메일·비밀번호로 가입

### 3-2. Stream Library 만들기

1. 상단 메뉴 **Stream** 클릭 → **Add Video Library**
2. 입력:
   - Name: `inclass-lectures`
   - Replication Regions: **Asia** 체크 (한국에서 빠름)
   - Original Storage Region: **Tokyo (TYO)** 또는 **Singapore (SG)**
3. **Add Video Library** → 만들어진 라이브러리 클릭

### 3-3. 보안 설정 (필수)

라이브러리 안에서 좌측 **Settings** → **Security**:

1. **Token Authentication** 토글을 **ON** 으로
2. 그 아래 **"Token Auth Key"** 라는 긴 문자열을 메모장에 적어두기 → 이게 `BUNNY_TOKEN_AUTH_KEY`
3. (선택) **Allowed Referrers** 에 나중에 정한 사이트 주소 추가하면 보안 더 강해짐

### 3-4. API 키 메모

1. 라이브러리 좌측 **API** 메뉴 클릭
2. **Library ID** (숫자, 예: `12345`) → `BUNNY_LIBRARY_ID`
3. **API Key** (긴 문자열) → `BUNNY_API_KEY`

### 3-5. 첫 영상 업로드 테스트

1. 라이브러리 좌측 **Videos** → 우측 상단 **Upload** → 짧은 mp4 영상 1개 드래그
2. 처리 완료 (1~3분) 후 영상 클릭 → 우측 하단 **GUID** 복사 (예: `abc12345-...`)

이 GUID가 나중에 우리 사이트에 붙여넣을 값입니다.

---

## 4단계 — Vercel에 사이트 띄우기 (15분)

### 4-1. 가입

1. <https://vercel.com> → **Sign Up** → GitHub 계정 연결

### 4-2. 프로젝트 가져오기

1. 대시보드 우측 상단 **Add New → Project**
2. **Import Git Repository** 에서 이 리포 선택
3. 설정 화면:
   - Framework Preset: **Next.js** (자동 감지)
   - **Root Directory**: `learning-platform` ← 중요! (Edit 클릭해서 입력)
   - Build/Output: 그대로
4. 아직 **Deploy 누르지 말고**, 아래 **Environment Variables** 펼치기

### 4-3. 환경변수 입력

아래 7개를 한 줄씩 입력 (Name / Value):

```
NEXT_PUBLIC_SUPABASE_URL          → 2-3에서 메모한 값
NEXT_PUBLIC_SUPABASE_ANON_KEY     → 2-3에서 메모한 값
SUPABASE_SERVICE_ROLE_KEY         → 2-3에서 메모한 값
APP_URL                           → https://temp.vercel.app  (배포 후 진짜 주소로 바꿈)
SESSION_SECRET                    → 길이 32자 이상의 아무 문자열 (https://1password.com/password-generator/ 에서 생성)
SETUP_TOKEN                       → 임의 문자열 (예: my-secret-2026)
BUNNY_LIBRARY_ID                  → 3-4에서 메모한 값
BUNNY_API_KEY                     → 3-4에서 메모한 값
BUNNY_TOKEN_AUTH_KEY              → 3-3에서 메모한 값
```

### 4-4. 배포

**Deploy** 클릭 → 약 2~3분 대기.

배포가 끝나면 화면에 사이트 주소가 보입니다 (예: `inclass-abc123.vercel.app`).

### 4-5. APP_URL 다시 설정

1. **Settings → Environment Variables** 들어가서 `APP_URL` 값을 위에서 본 진짜 주소(`https://...vercel.app`)로 수정
2. **Deployments** 탭 → 최신 배포 우측 ⋯ → **Redeploy**

---

## 5단계 — 첫 관리자 계정 만들기 (3분)

1. 사이트 주소 + `/setup` 으로 접속 (예: `https://inclass-abc123.vercel.app/setup`)
2. SETUP_TOKEN: 4-3에서 정한 값
3. 아이디·이름·비밀번호 입력 → 생성
4. 자동으로 로그인 화면 → 방금 만든 계정으로 로그인

---

## 6단계 — 운영 시작

관리자 화면(좌측 메뉴) 순서대로:

### 6-1. Bunny.net 상태 확인

좌측 **Bunny.net 상태** → "정상 연결" 이면 OK.

### 6-2. 문제집·강의 등록

1. **문제집/강의** → 문제집 추가
2. 문제집 클릭 → 문제 1번, 2번… 추가
3. 각 문제마다 팁/개념/유형 슬롯에:
   - Bunny.net 사이트로 이동 → 영상 업로드 → GUID 복사
   - 우리 관리자 화면으로 돌아와 GUID 칸에 붙여넣고 등록 클릭

### 6-3. 학생 계정

**학생 계정** → 아이디·이름·초기비밀번호 입력 → 생성. 학생에게 사이트 주소 + 로그인 정보 안내.

퇴원 시 → 학생 행 우측 **휴면 처리** 클릭. 데이터는 보존되며, 로그인만 차단됩니다. 복귀 시 다시 활성화.

### 6-4. 2년 로드맵

**2년 로드맵** → 학생 클릭 → 시작·종료일 저장 → 단계별 문제집·기간 추가.

### 6-5. 학습 플랜 자동분배

**학습 플랜** → 학생·문제집·시작·종료·요일(일요일 기본 제외)·하루 시간 → 자동 분배. 일별 결과를 직접 손볼 수도 있음.

### 6-6. 분석 보기

**분석** → 학생별 진척률, **팁강의 의존도** 까지 확인.

---

## 자주 막히는 곳

| 증상 | 해결 |
|---|---|
| 사이트 접속 시 500 에러 | Vercel → Settings → Environment Variables 에 7개 다 들어있는지 확인. 빠진 키 추가 후 Redeploy. |
| 로그인 직후 자꾸 튕겨나감 | `SESSION_SECRET` 이 32자 미만일 때 발생. 더 길게 다시 설정 후 Redeploy. |
| `/setup` 들어가니 "이미 관리자가 있습니다" | 정상. 관리자가 이미 만들어진 상태. `/login` 으로 가세요. |
| Bunny.net 상태 "연결 실패" | LIBRARY_ID·API_KEY 오타 확인. Bunny 라이브러리 설정에서 다시 복사. |
| 영상 페이지에서 "비디오를 찾을 수 없음" | GUID가 잘못 입력됐거나, 토큰 인증이 꺼져 있음. Bunny 라이브러리 Security에서 Token Auth ON 확인. |
| 영상 끊김 / 화질 낮음 | Bunny 라이브러리에서 Replication Region 추가 (Asia, North America 등). |
| 도메인 연결 | Vercel → Settings → Domains 에서 도메인 추가 → 안내 따라 DNS 설정. APP_URL 도 새 도메인으로 업데이트 후 Redeploy. |

---

## 비용 모니터링

- Bunny: <https://dash.bunny.net> 좌측 **Billing** 에서 잔액 확인. $5 충전 후 부족하면 자동 충전.
- Supabase Free → Pro 전환 알림은 Settings → Billing 에서 확인.
- Vercel Hobby 무료 한도(100GB 대역폭) 초과 시 메일 옴 → Pro($20/월) 전환 검토.

규모별 예상 비용 (한국 학원 기준):

| 학생 수 | 월 비용 |
|---|---|
| 약 20명 | 3.5만원 |
| 약 80명 | 8만원 |
| 약 250명 | 11만원 |

---

## 폴더 구조 (참고용, 안 봐도 됨)

```
learning-platform/
├─ src/
│  ├─ app/
│  │  ├─ (student)/   # 학생 화면
│  │  ├─ admin/       # 관리자 화면
│  │  ├─ api/         # 서버 처리 (인증, 등록, 진도 기록)
│  │  └─ login/, setup/
│  └─ lib/            # 공용 코드 (Bunny, Supabase, 자동분배)
├─ supabase/migrations/0001_init.sql
└─ .env.example
```

## 보안 요약

- 학생 비밀번호는 bcrypt 해시 저장
- 세션은 HttpOnly 쿠키 + JWT (30일)
- 휴면 계정은 매 요청마다 재검증 → 즉시 로그아웃
- 영상 임베드는 4시간 만료 토큰 → 링크 유출 시간 제한
- Supabase service_role 키는 서버에서만 사용
- 관리자 액션은 모두 권한 검사

## 코드 변경하고 싶을 때

깃허브에 있는 파일을 수정 후 main(또는 default) 브랜치로 푸시 → Vercel이 자동으로 다시 배포 → 1~2분 후 반영. 다운타임 없음.

문제가 생기면 Vercel **Deployments** 에서 이전 배포로 **Promote** 클릭 → 즉시 롤백.
