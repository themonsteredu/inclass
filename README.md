# inclass — 시놀로지 학원 강의 시스템

문제집 → 문제 → (팁강의 · 개념강의 · 유형강의) 구조로 동영상 강의를 제공하고,
학생별 로그인·접근 권한·시청 진도 추적을 지원하는 **순수 PHP** 앱.
시놀로지 NAS의 Web Station(PHP 8.2)에 파일만 복사하면 바로 동작합니다.

## 주요 기능

- **학생 로그인** — 관리자가 발급한 계정만 접속 가능
- **문제집 단위 접근 권한** — 관리자가 "이 학생은 이 문제집 볼 수 있음" 체크
- **영상 업로드** — 웹 관리자 페이지에서 바로 업로드 (파일은 `videos/` 폴더에 저장)
- **보안 스트리밍** — `stream.php`가 로그인·권한을 확인하고 HTTP Range 방식으로 재생
- **시청 진도 자동 기록** — 10초마다 저장, 탭 닫아도 `sendBeacon`으로 최종 플러시
- **관리자 대시보드** — 콘텐츠, 학생 계정, 접근 권한, 수강 현황

## 필요한 것

| 항목        | 요구사항                                               |
|------------|-------------------------------------------------------|
| Synology   | DSM 7 이상, Web Station 패키지 설치                   |
| PHP        | **8.2** (스크린샷에 보이는 "daittda" PHP 서비스 재사용 가능) |
| 외부 접속  | DDNS + 80/443 포트포워딩 + Let's Encrypt 인증서       |

SQLite는 PHP에 내장돼 있어 **별도 DB 패키지 설치가 필요 없습니다**.

---

## 🚀 시놀로지 배포 가이드 (한 번만 따라하면 됨)

### 1단계 — 폴더 복사

1. 이 리포지토리의 `daittda-lecture/` **폴더 전체**를 다운로드
   - GitHub에서 `Code → Download ZIP` 클릭 후 압축 해제
2. 시놀로지에 로그인 → **File Station** 열기
3. 좌측에서 `web` 폴더 클릭
4. 상단 **업로드 → 폴더 업로드** → 위에서 받은 `daittda-lecture` 폴더 선택
5. 완료되면 `web/daittda-lecture/` 경로에 파일들이 들어있어야 함

### 2단계 — 폴더 쓰기 권한 부여 (중요)

`data/` 와 `videos/` 폴더에 PHP가 파일을 쓸 수 있어야 DB 생성·영상 업로드가 됩니다.

1. File Station에서 `web/daittda-lecture/data` 우클릭 → **속성 → 권한**
2. **http** 또는 **user** 시스템 계정에 **읽기/쓰기** 권한 부여 → 적용 (하위 적용 체크)
3. `web/daittda-lecture/videos` 도 동일하게

### 3단계 — PHP 업로드 한도 올리기

기본값으로는 보통 2MB 까지만 업로드됩니다. 강의 영상은 훨씬 큽니다.

1. **제어판 → 웹 서비스** (또는 Web Station → 스크립트 언어 설정)
2. **PHP 8.2** 선택 → 편집 → **Extensions** 탭에서 `pdo_sqlite`, `sqlite3`, `fileinfo` 체크 확인
3. **Core** 탭에서:
   - `upload_max_filesize` = `2048M`
   - `post_max_size` = `2048M`
   - `max_execution_time` = `600`
   - `memory_limit` = `512M`
4. 저장

### 4단계 — Web Portal 연결

이미 `daittda` 라는 PHP 웹 포털이 `web/` 에 있으므로, **서브디렉토리로 그대로 접속**됩니다:

```
http://시놀로지-IP/daittda-lecture/
```

만약 별도 포털을 만들고 싶다면:
- Web Station → **웹 서비스 → 생성 → PHP** → 문서 루트를 `web/daittda-lecture` 로 지정
- Web Station → **웹 포털 → 생성 → 이름 기반** 으로 서브도메인 연결 가능

### 5단계 — 최초 관리자 계정 만들기

1. 브라우저에서 `http://시놀로지-IP/daittda-lecture/` 접속
2. 처음이면 자동으로 `/setup.php`로 이동 → **관리자 아이디/이름/비밀번호** 입력 → 생성
3. 자동으로 관리자 대시보드로 이동

### 6단계 — 학생 운영 시작

관리자 대시보드에서 순서대로:

1. **문제집 / 문제 / 강의 관리** → 문제집 추가 → 문제 추가 → 각 문제에 3종(팁/개념/유형) 강의 영상 업로드
2. **학생 계정 관리** → 학생별 아이디·이름·초기비밀번호 등록
3. **강의 접근 권한** → 각 학생에게 체크박스로 **"볼 수 있는 문제집"** 지정
4. **수강 현황** → 학생들이 시청하기 시작하면 누적 시간·완료 여부 자동 기록

학생에겐 `https://학원도메인/daittda-lecture/login.php` 주소와 아이디·비밀번호를 안내하면 됩니다.

---

## 🌐 인터넷에서 접속 가능하게 만들기

### (A) DDNS 설정 — 외부에서 시놀로지로 연결되는 주소 만들기

1. 제어판 → **외부 액세스 → DDNS → 추가**
2. 서비스 공급자: **Synology** 선택 → 시놀로지 계정 로그인 → 원하는 호스트 이름 (예: `myacademy.synology.me`) → 확인
3. 상태가 "정상" 이면 성공

### (B) 공유기 포트포워딩

공유기 관리자 페이지에서:
- 외부 포트 **80** → 시놀로지 내부 IP:80 (HTTP)
- 외부 포트 **443** → 시놀로지 내부 IP:443 (HTTPS)

### (C) HTTPS 인증서 발급 (무료, 권장)

1. 제어판 → **보안 → 인증서 → 추가 → 새 인증서 추가 → Let's Encrypt**
2. 도메인 이름에 위에서 만든 DDNS 주소 입력 → 이메일 입력 → 적용
3. 발급되면 Web Station 에서 HTTPS 자동 적용

그리고 **Web Station → 웹 서비스 포털 → daittda**의 HTTPS 리다이렉션을 켜주세요.
학생들에게는 `https://myacademy.synology.me/daittda-lecture/` 형태로 안내하시면 됩니다.

### (D) 방화벽 (선택)

외부 접속을 허용하되 국가별로 제한하려면:
- 제어판 → **보안 → 방화벽** → "한국에서만 접속 허용" 규칙 추가

---

## 🔁 매일 개발 워크플로우

```
[수정]
  ↓ 로컬 PC 또는 File Station에서 .php 파일 편집
[배포]
  ↓ File Station 으로 변경된 파일만 web/daittda-lecture/ 에 덮어쓰기
[확인]
  ↓ 브라우저 새로고침 — 즉시 반영됨 (PHP는 빌드 과정 없음)
```

나중에 편해지면 Synology **Git Server** 패키지로 `git push → 자동 pull` 구성 가능.

---

## 📁 폴더 구조

```
daittda-lecture/
├── index.php             # 홈 (로그인 상태에 따라 분기)
├── login.php / logout.php
├── setup.php             # 최초 관리자 생성 (한 번만)
├── workbooks.php         # 학생: 내가 배정받은 문제집 목록
├── workbook.php          # 학생: 문제 목록
├── problem.php           # 학생: 3종 강의 카드
├── lecture.php           # 학생: 플레이어 + 진도 추적
├── stream.php            # 권한 확인 후 Range 스트리밍
├── progress.php          # 시청 시간 저장 API (JSON)
├── admin/
│   ├── index.php              # 대시보드
│   ├── workbooks.php          # 문제집 CRUD
│   ├── workbook.php           # 문제/강의 CRUD + 업로드
│   ├── upload.php             # 영상 업로드 처리
│   ├── users.php              # 학생 계정 관리
│   ├── enrollments.php        # 접근 권한 목록
│   ├── enrollment.php         # 학생별 접근 권한 편집
│   ├── analytics.php          # 수강 현황 요약
│   ├── analytics_user.php     # 학생별 상세
│   └── analytics_lecture.php  # 강의별 상세
├── lib/                  # 공용 코드 (웹 직접 접근 차단)
│   ├── config.php
│   ├── bootstrap.php
│   ├── db.php
│   ├── auth.php
│   ├── helpers.php
│   └── layout.php
├── assets/style.css
├── data/                 # SQLite DB 저장 (웹 접근 차단)
└── videos/               # 업로드 영상 저장 (stream.php 를 통해서만 서빙)
```

## 🔒 보안 메모

- 업로드된 영상은 `videos/` 폴더에 저장되며 **직접 URL로 접근 불가** (.htaccess로 차단).
  학생이 영상을 보려면 반드시 `stream.php` → 로그인 + 접근 권한 확인을 거칩니다.
- 비밀번호는 `password_hash()` (bcrypt) 로 저장됩니다.
- CSRF 토큰이 모든 변경 요청에 필수입니다.
- HTTPS 필수 — 로그인 쿠키가 평문으로 돌아다니지 않도록 Let's Encrypt 를 꼭 적용하세요.

## 🛠 문제 해결

**"data 폴더에 쓸 수 없습니다"** → 2단계 권한 부여를 다시 확인하세요.

**"413 Request Entity Too Large"** → 3단계 PHP 업로드 한도를 올리세요. 그래도 실패하면 Web Station의 Nginx/Apache `client_max_body_size` 설정도 늘려야 합니다 (DSM 7: Web Station → 웹 서비스 포털 → 사용자 지정).

**영상 재생이 안 됨 (검은 화면)** → 관리자가 업로드한 포맷을 확인하세요. H.264 코덱의 MP4가 가장 호환성이 좋습니다. `.mkv`는 브라우저가 코덱을 지원해야 재생됩니다.

**로그인 후 바로 튕김** → 세션 쿠키가 HTTPS 에서만 동작하도록 설정돼 있습니다. HTTPS 로 접속 중인지 확인하세요. (`lib/bootstrap.php` 의 `secure` 옵션)
