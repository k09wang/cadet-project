# QA 보고서 — artbridge 보완 검증 (STAGE 5)

- **실행일:** 2026-06-20
- **모드:** 보완 목적 재실행 (신규 개발 아님, 기존 `src/` 대상)
- **검증 환경:** Next.js 16.2.9 (dev @ :3000), Prisma 6.19 / Postgres(Neon), Node 25
- **판정:** ⚠️ **CONDITIONAL PASS** — 핵심 기능 정상, lint 게이트 1건 결함으로 배포 게이트 차단 상태

---

## 1. 검증 게이트 결과

| 게이트 | 명령 | 결과 |
|--------|------|------|
| typecheck | `npm run typecheck` | ✅ PASS |
| lint | `npm run lint` | ❌ **FAIL (1건)** |
| 단위 테스트 | `npm test` (vitest) | ✅ PASS 520/520 (77파일) |
| 빌드 | `npm run build` | ✅ PASS (전 라우트 빌드, warn 1) |
| E2E | `npx playwright test` | ⚠️ **미구성** (config/테스트 0건) |

## 2. 런타임 직접 사용 검증 (실기동)

**공개 페이지** — 모두 200 OK: `/`, `/login`, `/signup`, `/creators`, `/programs`, `/programs/demo-program-completed`, `/creators/{cuid}`

**인증 체인** — 정상 동작:
- CSRF 토큰 발급 → `POST /api/auth/callback/credentials` (demo creator) → 302
- 세션 조회 → `{user:{...,role:"CREATOR"}}` 정상
- 미인증 시 `/dashboard/*`, `/notifications` → 307 리다이렉트
- 인증 후 → 200

**API 경계면** — zod 검증 정상:
- `GET /api/notifications` (인증) → 200 + 데이터
- `PATCH /api/notifications/read-all` → 200 `{count:1}`
- `POST /api/community-posts` 잘못된 입력 → 400 + 상세 issues
- `PATCH /api/studio` 잘못된 입력 → 400
- 쓰기 전용 라우트(posts/membership-plans/community-posts/studio)는 POST/PATCH only → 정상 설계

**DB** — 스키마 + 시드 정상: 테이블 17개, user=5 / program=4 / post=5

---

## 3. 결정적 에러 / 수정 필요

### 🔴 D-1. lint 게이트 실패 (배포 차단)
- **파일:** `src/app/login/actions.ts:6`
- **내용:** `getCurrentUser` import가 사용되지 않음 (`@typescript-eslint/no-unused-vars`)
- **영향:** `npm run lint` exit≠0 → CI/배포 게이트 차단
- **수정:** 해당 import 라인 삭제. (dbUser 직접 조회로 role을 얻으므로 불필요해진 import)

### 🟠 D-2. E2E(Playwright) 게이트 미구성
- **현상:** `playwright` devDep은 있으나 `playwright.config.*` 없음, e2e 테스트 파일 0건
- **영향:** 하네스가 `npx playwright test`를 게이트로 규정하나 실제로 아무 테스트도 실행되지 않음 → 회귀 방어망 없음. 단위/컴포넌트 테스트는 520개로 충실하나, 브라우저 통합 흐름(로그인→결제→컨트랙트 등)은 무보증
- **수정:** 최소한의 smoke e2e(로그인 플로우, 프로그램 상세) 추가 + config 작성

---

## 4. 보완 권장

### 🟡 I-1. `prisma migrate status` 거짓 음성
- **현상:** `migrate status` → "0 applied, 0 pending" 이지만 DB는 실제로 마이그레이션 7개 모두 적용됨(17개 테이블 + 시드 존재)
- **원인 추정:** Neon transaction pooler(`DATABASE_URL`) / session pooler(`DIRECT_URL`) 조합에서 직접 연결 매칭 불일치
- **위험:** CI 배포 게이트가 migrate status를 신뢰하면 "마이그레이션 안 됨" 오탐으로 빌드/배포 중단 가능
- **권장:** 배포 게이트는 `migrate status` 대신 실제 `_prisma_migrations` 카운트 또는 `migrate deploy` 결과로 판정

### 🟡 I-2. Prisma 7 config deprecation
- **현상:** 빌드 warn — `package.json#prisma` 속성이 Prisma 7에서 제거 예정
- **권장:** `prisma.seed`를 `prisma.config.ts`로 이전 (Prisma 6에서도 지원)

### 🟡 I-3. dev 서버 중복 실행 감지 (참고 사항)
- 기존 dev(:3000) 실행 중일 때 `npm run dev`가 :3001로 바인딩 후 자가 종료됨. 개발 환경 운영 참고(결함 아님)

---

## 5. 정상 확인 요약 (회귀 없음)

typecheck / vitest 520 / build / DB 스키마·시드 / NextAuth 인증 체인 / 공개·상세 페이지 렌더 / 쓰기 API zod 검증 / 프론트-백엔드 HTTP 메서드 정합성 — **모두 정상**

## 6. 배포 진입 조건

- D-1(lint) 수정 전까지 **배포 불가** (FAIL)
- D-1 수정 시 lint PASS → 다른 게이트 이미 통과 → 배포 진입 가능
- D-2(E2E)는 배포 블로커는 아니나 품질 부채로 추후 보완 권장
