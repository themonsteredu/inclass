# 학원 학습 플랫폼 — 셋업 가이드

이 가이드는 **개발 경험 없는 분**이 천천히 따라하면 1시간 안에 사이트를 띄울 수 있도록 만든 클릭 단위 안내서입니다.

> 사이트 구조: 영상은 **Vimeo**(영상 전용 플랫폼, 한국 네트워크 안정), 사이트 화면은 **Vercel**, 학생·문제집 데이터는 **Supabase**(데이터베이스). 다 무료/저가로 시작 가능.

---

## 0단계 — 미리 준비할 것

| 무엇 | 어디서 | 비용 |
|---|---|---|
| 결제 가능한 카드 | Vimeo 결제용 | $12~$65/월 (플랜 따라) |
| 신용카드 등록할 수 있는 메일 | Vercel·Supabase·Vimeo 가입 | 0원 |
| 학원 이름 (영문) | 사이트 이름·도메인 후보 | 0원 |
| 도메인 (선택) | 가비아/카페24 등 | 연 5,500원~ (없어도 임시 vercel.app 주소로 시작 가능) |

**총 예상 시간**: 가입·셋업 60~90분 + 첫 영상 1개 등록 10분.

> **⚠️ 중요**: 영상 보안(외부 사이트에서 못 트는 도메인 잠금)은 **Vimeo Plus 플랜 이상**에서만 됩니다. 무료 플랜이나 Starter 플랜은 학원 영상 보호용으로는 부족하므로 **Plus($7/월) 또는 Standard($20/월)** 가입을 권장합니다.

---

## 1단계 — 깃허브 계정 (10분)

이미 있다면 건너뛰세요.

1. <https://github.com/signup> 에서 가입
2. 이 리포를 받기 위해 **fork** 하거나, 기존 리포를 그대로 사용

---

## 2단계 — Supabase 만들기 (15분)

### 2-1. 가입과 프로젝트 생성

1. <https://supabase.com> → **Start your project**
2. GitHub 또는 이메일로 로그인
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

## 3단계 — Vimeo 셋업 (15분)

영상이 들어갈 곳입니다. Vimeo는 영상 전용 플랫폼이라 끊김 적고 화질 자동조절이 잘 됩니다.

### 3-1. 가입 + 유료 플랜

1. <https://vimeo.com/upgrade> 접속
2. **Plus** ($7/월) 또는 **Standard** ($20/월) 선택해서 가입
   - **Plus**: 250GB 저장 + 도메인 잠금 가능 → 학원 시작에 충분
   - **Standard**: 1TB 저장 + 더 많은 분석 기능
3. 카드 등록 후 가입 완료

### 3-2. 도메인 잠금 기본 설정

이 설정은 **모든 영상의 기본 보안**이 됩니다.

1. 우측 상단 프로필 → **Settings** → **Videos** → **Embed**
2. **Specific domains** 선택
3. 본인 사이트 주소 추가 (예: `inclass-abc123.vercel.app`, 도메인 있다면 그 도메인도 추가)
4. **Save**

> 사이트 주소를 아직 모르면 4단계 끝나고 다시 와서 추가해도 됩니다. 처음엔 일단 비워두고 진행하세요.

### 3-3. 첫 영상 업로드 테스트

1. 상단 **Upload** → 짧은 mp4 영상 1개 드래그 → 업로드 (1~3분 처리)
2. 처리 완료 후 영상 클릭 → 우측 **Settings (톱니바퀴)** → **Privacy**
3. **Where can this be embedded?** → **Specific domains** 선택 → 위 3-2와 동일한 도메인 추가
4. **Who can watch?** → **Hide from Vimeo.com** 선택 (외부에서 검색·접속 불가)
5. **Save**

영상 페이지 주소(예: `https://vimeo.com/123456789`)에서 끝의 **숫자 부분**을 메모. 이게 나중에 우리 관리자 화면에 붙여넣을 ID입니다.

### 3-4. API 토큰 발급

1. <https://developer.vimeo.com/apps> 접속 → 로그인
2. **Create App** → 앱 이름(`inclass-server` 등) → 설명 입력 → **Create App**
3. 생성된 앱 페이지 → **Personal Access Tokens** 섹션
4. **Generate Token** 클릭
5. 권한 체크박스에서 **Public** + **Private** 두 개 체크 → **Generate**
6. 생성된 긴 토큰 문자열을 **즉시 복사**해서 메모장에 적기 → 이게 `VIMEO_ACCESS_TOKEN`

> ⚠️ 토큰은 **창을 닫으면 다시 못 봅니다.** 반드시 그 자리에서 메모장에 옮기세요.

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
VIMEO_ACCESS_TOKEN                → 3-4에서 메모한 값
```

### 4-4. 배포

**Deploy** 클릭 → 약 2~3분 대기.

배포가 끝나면 화면에 사이트 주소가 보입니다 (예: `inclass-abc123.vercel.app`).

### 4-5. APP_URL 다시 설정 + Vimeo 도메인 잠금 마무리

1. Vercel **Settings → Environment Variables** 들어가서 `APP_URL` 값을 위에서 본 진짜 주소(`https://...vercel.app`)로 수정
2. **Deployments** 탭 → 최신 배포 우측 ⋯ → **Redeploy**
3. Vimeo 다시 들어가서 3-2 설정에 이 사이트 주소를 추가 (아직 안 했다면)

---

## 5단계 — 첫 관리자 계정 만들기 (3분)

1. 사이트 주소 + `/setup` 으로 접속 (예: `https://inclass-abc123.vercel.app/setup`)
2. SETUP_TOKEN: 4-3에서 정한 값
3. 아이디·이름·비밀번호 입력 → 생성
4. 자동으로 로그인 화면 → 방금 만든 계정으로 로그인

---

## 6단계 — 운영 시작

관리자 화면(좌측 메뉴) 순서대로:

### 6-1. Vimeo 상태 확인

좌측 **Vimeo 상태** → "정상 연결" 이면 OK.

### 6-2. 문제집·강의 등록

1. **문제집/강의** → 문제집 추가
2. 문제집 클릭 → 문제 1번, 2번… 추가
3. 각 문제마다 팁/개념/유형 슬롯에:
   - Vimeo 사이트로 이동 → 영상 업로드 → Privacy 설정 (3-3과 동일) → 영상 ID 복사
   - 우리 관리자 화면으로 돌아와 ID 칸에 붙여넣고 등록 클릭
   - URL 통째로 붙여넣어도 자동으로 ID만 추출됩니다

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
| Vimeo 상태 "연결 실패" | `VIMEO_ACCESS_TOKEN` 오타 확인. 토큰을 다시 발급받아야 할 수도 있음. |
| 영상 페이지에서 "Sorry, this video doesn't exist" | 영상 ID가 잘못 입력됐거나, 영상이 비공개라 토큰으로 접근 불가. Privacy 설정 재확인. |
| 영상 페이지에서 "Because of its privacy settings, this video cannot be played here" | Vimeo의 Embed Privacy 도메인 화이트리스트에 사이트 주소가 안 들어있음. 3-2와 3-3을 다시 확인. |
| 영상 끊김 / 화질 낮음 | Vimeo는 자동 화질 조절이라 학생 와이파이 따라 변동. 너무 자주 끊기면 Standard 플랜으로 업그레이드 검토. |
| 도메인 연결 | Vercel → Settings → Domains 에서 도메인 추가 → 안내 따라 DNS 설정. APP_URL 도 새 도메인으로 업데이트 후 Redeploy. **Vimeo의 도메인 화이트리스트에도 새 도메인 추가 잊지 말기**. |

---

## 비용 모니터링

- Vimeo: <https://vimeo.com/settings/billing> 에서 플랜과 다음 결제일 확인.
- Supabase Free → Pro 전환 알림은 Settings → Billing 에서 확인.
- Vercel Hobby 무료 한도(100GB 대역폭) 초과 시 메일 옴 → Pro($20/월) 전환 검토. 영상은 Vimeo가 직접 송출하므로 학생이 영상 봐도 Vercel 트래픽엔 거의 영향 없음.

규모별 예상 비용 (한국 학원 기준):

| 학생 수 | 월 비용 | 비고 |
|---|---|---|
| 약 20명 | 약 1만원 + Vimeo($7~20) | Plus 플랜으로 충분 |
| 약 80명 | 약 1만원 + Vimeo($20~65) | Standard 권장 |
| 약 250명 | 약 2만원 + Vimeo($65) | Advanced 권장 (대역폭 한도) |

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
│  └─ lib/            # 공용 코드 (Vimeo, Supabase, 자동분배)
├─ supabase/migrations/0001_init.sql
└─ .env.example
```

## 보안 요약

- 학생 비밀번호는 bcrypt 해시 저장
- 세션은 HttpOnly 쿠키 + JWT (30일)
- 휴면 계정은 매 요청마다 재검증 → 즉시 로그아웃
- 영상은 Vimeo의 **Hide from Vimeo + 도메인 화이트리스트** 로 보호 → 외부 사이트나 vimeo.com에서 직접 못 봄
- Supabase service_role 키, Vimeo Access Token 은 서버에서만 사용
- 관리자 액션은 모두 권한 검사

## 코드 변경하고 싶을 때

깃허브에 있는 파일을 수정 후 main(또는 default) 브랜치로 푸시 → Vercel이 자동으로 다시 배포 → 1~2분 후 반영. 다운타임 없음.

문제가 생기면 Vercel **Deployments** 에서 이전 배포로 **Promote** 클릭 → 즉시 롤백.
