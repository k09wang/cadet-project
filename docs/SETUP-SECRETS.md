# ArtBridge — 진짜 내 정보(시크릿) 설정 가이드

> 이 문서는 **실제 사용자가 직접 채워야 하는 값**들만 정리합니다.
> 코드는 키가 없어도 **Mock 폴백**으로 동작하므로, 아무것도 설정하지 않아도 데모는 정상 작동합니다.
> 상용/실결제/소셜 로그인을 켜려면 아래 값을 `.env`에 채우세요.

---

## 0. 동작 요약 (키 없을 때의 기본 동작)

| 항목 | 키 없을 때 | 키 있을 때 |
|------|-----------|-----------|
| 결제(PG) | **Mock Provider** — 외부 호출 없이 항상 성공, 즉시 PAID | PortOne/Toss sandbox 결제창 + 서버 검증 |
| 로그인 | **이메일/비밀번호(Credentials)** 만 | + Google 소셜 로그인 |
| AI 추천 | **결정론적 Mock 추천** | OpenAI JSON schema 호출 |
| 이미지 업로드 | 비활성화 | Cloudinary/Supabase Storage |

즉, **로컬 데모만 돌린다면 이 문서의 어떤 값도 필요 없습니다.** `.env`에 `DATABASE_URL`과 `AUTH_SECRET`만 있으면 됩니다(현재 이미 설정됨).

---

## 1. 데이터베이스 — `DATABASE_URL`, `DIRECT_URL` (필수)

PostgreSQL 연결 문자열. Supabase / Neon / 로컬 Postgres 중 택1.

**Supabase 기준 발급 절차:**
1. https://supabase.com → 새 프로젝트 생성
2. `Project Settings → Database → Connection string`
3. 두 가지를 복사 (IPv4 add-on이 없으면 pooler 사용):
   - **Transaction pooler** (앱 런타임용, 포트 6543, `?pgbouncer=true`) → `DATABASE_URL`
   - **Session pooler** (마이그레이션용, 포트 5432) → `DIRECT_URL`
4. 비밀번호(`[YOUR-PASSWORD]`)를 실제 프로젝트 비밀번호로 치환

```env
DATABASE_URL="postgresql://<user>:<password>@<host>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://<user>:<password>@<host>.pooler.supabase.com:5432/postgres"
```

적용 후:
```bash
npx prisma migrate deploy   # 스키마 반영
npm run db:seed             # 데모 데이터
```

> ⚠️ `DIRECT_URL`은 Prisma 마이그레이션/Prisma Studio용입니다. 생략 시 마이그레이션이 트랜잭션 풀러에서 실패할 수 있습니다.

---

## 2. 세션 서명 키 — `AUTH_SECRET` (필수)

Auth.js v5가 JWT/세션 쿠키를 서명하는 키. 없으면 인증 불가.

```bash
openssl rand -hex 32
```

출력값을 `.env`에:
```env
AUTH_SECRET=<위 명령 출력>
NEXT_PUBLIC_APP_URL=http://localhost:3000   # OAuth 콜백 기준 URL
```

> 배포 시 `NEXT_PUBLIC_APP_URL`을 프로덕션 도메인으로 변경 (예: `https://artbridge.vercel.app`).

---

## 3. Google 소셜 로그인 — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (선택)

**발급 절차 (Google Cloud Console):**
1. https://console.cloud.google.com → 프로젝트 선택/생성
2. `APIs & Services → OAuth consent screen` → External → 앱 정보 입력
3. `APIs & Services → Credentials → Create Credentials → OAuth client ID`
   - Application type: **Web application**
   - Authorized redirect URIs에 추가:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://<배포도메인>/api/auth/callback/google`
4. 생성된 **Client ID** / **Client Secret** 복사

```env
GOOGLE_CLIENT_ID=<...>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<...>
```

> Kakao 소셜 로그인은 현재 미구현입니다. Credentials(이메일/비밀번호) 로그인은 항상 활성화되어 있어 소셜 없이도 가입/로그인 가능합니다.

---

## 4. 결제(PG) Sandbox — PortOne / Toss (선택)

코드: `src/lib/payment/provider.ts`의 `resolvePaymentProvider()`가 분기합니다.

### 4-A. PortOne (구 아임포트) — 권장

**발급 절차:**
1. https://portone.io 가입 → 테스트용 채널 생성
2. `결제 연동 → 식별 코드`에서 다음 세 값 확보:
   - Store ID (프론트 노출 가능)
   - Channel Key (프론트 노출 가능)
   - API Secret (`Authorization: PortOne <apiSecret>`) — **서버 전용, 프론트 비노출**

```env
PAYMENT_PROVIDER=portone
NEXT_PUBLIC_PORTONE_STORE_ID=<store-id>
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=<channel-key>
PORTONE_API_SECRET=<api-secret>
```

### 4-B. Toss Payments

**발급 절차:**
1. https://developers.tosspayments.com → 테스트 상점 생성
2. `내 정보 → API 키`에서 Client Key / Secret Key 확보

```env
PAYMENT_PROVIDER=toss
NEXT_PUBLIC_TOSS_CLIENT_KEY=<client-key>
TOSS_SECRET_KEY=<secret-key>
```

> 세 값이 **모두** 있어야 sandbox로 전환됩니다. 하나라도 누락되면 자동으로 Mock 폴백합니다 (`provider.ts:215` `resolvePaymentProvider`).
> 실제 PG 네트워크 호출(PortOne REST 단건 조회)은 키가 있을 때만 발생하며, 키가 없으면 절대 호출되지 않습니다.

---

## 5. 기타 선택 항목

### AI 추천 — `OPENAI_API_KEY` (선택)
```env
OPENAI_API_KEY=sk-...
```
비워두면 결정론적 Mock 추천이 동작합니다.

### 이미지 업로드 — Cloudinary / Supabase Storage (선택)
```env
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
# 또는
SUPABASE_STORAGE_URL=<...>
```

---

## 6. 적용 체크리스트

- [ ] `.env`에 `DATABASE_URL` + `DIRECT_URL` 설정
- [ ] `AUTH_SECRET` + `NEXT_PUBLIC_APP_URL` 설정
- [ ] (선택) Google OAuth 값 입력
- [ ] (선택) PG sandbox — `PAYMENT_PROVIDER` + 해당 PG 3종 키 모두 입력 (누락 시 Mock 자동 폴백)
- [ ] `npx prisma migrate deploy && npm run db:seed`
- [ ] `npm run dev` → http://localhost:3000

> 데모 계정 비밀번호는 모든 시드 계정 공통입니다 (`prisma/seed.ts`의 `DEMO_PASSWORD`).
