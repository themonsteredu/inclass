# inclass — 강의 시스템

문제집 → 문제 → (팁강의 · 개념강의 · 유형강의) 구조로 동영상 강의를 제공하고,
학생별 로그인과 시청 진도 추적을 지원하는 풀스택 Next.js 앱.

## 기능

- **개인 아이디 로그인** (NextAuth Credentials + bcrypt)
- **자체 동영상 업로드** 및 HTTP Range 스트리밍 (시킹/일시정지/재개)
- **문제집 / 문제 / 3종 강의** (TIP 팁 · CONCEPT 개념 · PATTERN 유형) 관리
- **시청 추적**: 10초마다 진도 저장, 이탈 시 `sendBeacon`으로 안전 플러시
- **관리자 대시보드**
  - 콘텐츠 관리 (문제집/문제/강의 업로드)
  - 사용자 관리 (등록·비밀번호 재설정·삭제)
  - 수강 현황 (학생별 / 강의별 시청 시간·완료 여부·진행률·최근 수강 시각)

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Prisma + SQLite (운영 시 Postgres로 `datasource` 교체만 하면 됨)
- NextAuth.js (JWT 세션)
- Tailwind CSS

## 시작하기

```bash
# 1) 의존성 설치
npm install

# 2) 환경 변수 설정
cp .env.example .env
# NEXTAUTH_SECRET는 `openssl rand -base64 32` 결과로 교체하세요.

# 3) 데이터베이스 생성 + 시드
npx prisma migrate dev --name init
npm run db:seed

# 4) 개발 서버
npm run dev
```

데모 계정:

| 아이디     | 비밀번호      | 권한    |
|-----------|--------------|--------|
| admin     | admin1234    | 관리자 |
| student1  | student1234  | 학생   |
| student2  | student1234  | 학생   |

## 주요 경로

| 경로 | 설명 |
|-----|------|
| `/login` | 로그인 |
| `/workbooks` | 학생용 문제집 목록 |
| `/workbooks/[id]` | 문제 목록 |
| `/problems/[id]` | 팁·개념·유형 3종 강의 카드 |
| `/lectures/[id]` | 비디오 플레이어 (진도 자동 추적) |
| `/admin` | 관리자 대시보드 |
| `/admin/workbooks` | 문제집·문제·강의 관리 + 영상 업로드 |
| `/admin/users` | 계정 관리 |
| `/admin/analytics` | 학생별 / 강의별 수강 현황 |

## 시청 추적 방식

- 플레이어가 `timeupdate`마다 실제 재생된 시간만 초단위로 누적하고,
  10초마다 `POST /api/progress`로 서버에 전송합니다.
- 탭 닫기·새로고침 시에는 `navigator.sendBeacon`으로 마지막 델타를 보장 전송합니다.
- 시청 시간이 영상 길이의 90% 이상이면 자동으로 `완료` 처리됩니다.

## 업로드·스트리밍

- 영상은 `UPLOAD_DIR` (기본 `./uploads`) 아래 `lectures/<id>.<ext>`로 저장됩니다.
- 클라이언트는 `/api/lectures/[id]/stream`로 요청하며, 서버가 HTTP `Range` 헤더를
  해석해 부분 전송(206) 응답을 내려주므로 큰 파일도 시킹이 가능합니다.
- 업로드는 관리자만 가능 (`/api/admin/upload`).

## 운영 메모

- SQLite는 개발·소규모 운영용. 프로덕션에서는 Postgres로 바꾸고 S3 같은 외부
  스토리지 + presigned URL 업로드로 확장하세요. 현재 스키마·API는 그대로
  재사용 가능합니다.
- HLS/DASH로 전환하려면 업로드 시 ffmpeg 트랜스코드 파이프라인을 추가하고,
  `LecturePlayer`를 hls.js 기반으로 교체하면 됩니다.
