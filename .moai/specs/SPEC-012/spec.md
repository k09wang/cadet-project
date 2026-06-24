# SPEC-012: PG Sandbox 결제 연동

## 1. 개요

- **목적**: 기존 SPEC-006(계약/Mock 결제)의 골격을 확장하여, 순수 `MockPaymentProvider` 대신 **실제 PG sandbox** 결제 흐름(결제 요청 생성 → 클라이언트 PG 결제창 → 콜백/리다이렉트 수신 → 서버 측 결제 검증 → 검증 성공 시에만 `Payment.status=PAID` 전환 및 에스크로 보관)을 도입한다. RFP "PG sandbox 결제(결제창→콜백→검증)"의 P0 갭을 메운다.
- **배경**: `docs/RFP-GAP-ANALYSIS.md` §3 "PG sandbox 결제 — ❌ 미구현(순수 Mock provider만)", §5 P0 #2 "실제 PG sandbox 연동 — 기존 `PaymentProvider` 인터페이스 뒤에 sandbox 어댑터 교체(비용 낮음)", §6 "PG sandbox는 `PaymentProvider` 인터페이스가 이미 잡혀 있어 어댑터 추가만으로 교체 가능". RFP 3.6.2/5: sandbox 환경, 테스트 키는 환경 변수, 결제 요청 → PG 결제창 → 콜백 검증 흐름, 결제 내역 조회 페이지.
- **핵심 설계 원칙**: SPEC-006이 설계 단계에서 의도한 확장점(`PaymentProvider` 인터페이스, NFR-005 "향후 `PortOnePaymentProvider`/`TossPaymentProvider` 구현을 허용하는 형태")을 그대로 따른다. 인터페이스 뒤에 `SandboxPaymentProvider` 어댑터를 추가하되, `MockPaymentProvider`는 테스트/오프라인 폴백으로 보존한다(환경 변수 유무로 런타임 분기).
- **PG 선택 (권장안)**: **PortOne(구 아임포트)** 를 권장한다. 근거는 §11에 상세 기술.
- **범위**:
  - **포함**: PG sandbox(PortOne 권장) 연동, 결제 요청(주문번호 발급) 생성, 클라이언트 결제창 호출, 콜백/리다이렉트 수신 라우트, **서버 측 결제 검증**(PG 단건 조회 API로 결제 금액·주문번호·상태 대조), 검증 성공 시에만 단일 트랜잭션으로 `Payment.status=PAID`·`Settlement`·`Program.status=IN_PROGRESS`·`Notification` 전환, `SandboxPaymentProvider` 어댑터 추가, `MockPaymentProvider` 폴백 보존(분기), PG 시크릿/키 환경 변수화, 1계약 1결제 멱등성 유지, 결제 내역 조회.
  - **제외**: 환불 API(`Payment.status=REFUNDED`) — Won't, 반복/정기 결제 — Won't, 실제 카드사 정산/은행 이체 — sandbox 상태 전환으로 대체, 멤버십/PAID 포스트 결제의 PG 전환(SPEC-003/009는 본 SPEC 범위 밖, 동일 어댑터 후속 적용 가능), 운영(production) PG 키·실거래 — sandbox 한정, 웹훅(webhook) 기반 비동기 알림을 결제 확정의 **유일** 경로로 삼는 설계(본 SPEC은 리다이렉트 콜백 + 서버 검증을 1차 경로로, 웹훅은 보강 경로로 둔다 — §10 참조).

## 2. 사용자 스토리

- As a **팬**, I want **양측 서명이 완료된 계약에서 "결제하기"를 누르면 실제 PG 결제창(sandbox)이 떠서 테스트 결제를 진행**할 수 있고, so that **데모에서 진짜 결제 흐름을 증명할 수 있다**.
- As a **팬**, I want **결제창에서 결제를 마치면 앱이 콜백을 받아 서버가 금액·주문번호를 검증한 뒤에만 결제 완료로 처리**되는 것을 보고, so that **위·변조 없는 안전한 결제임을 신뢰할 수 있다**.
- As a **발표자**, I want **PG 시크릿/API 키가 코드가 아니라 환경 변수로만 관리되고 리포지토리에 노출되지 않는 것**을 보이고, so that **보안 요구사항(키 분리)을 증명할 수 있다**.
- As a **개발자**, I want **PG 환경 변수가 없을 때는 `MockPaymentProvider`로 자동 폴백**되도록 하여, so that **CI/오프라인/테스트에서 외부 PG 없이도 결제 흐름을 검증할 수 있다**.
- As a **팬**, I want **결제 내역 페이지에서 내 결제 목록과 상태(PENDING/PAID/FAILED)를 조회**할 수 있고, so that **결제 결과를 사후에 확인할 수 있다**.

## 3. 관련 모델 및 상태

### 관련 Prisma 모델 (실제 `prisma/schema.prisma` 기준)

- **`Contract`** (`contracts`): `id`, `applicationId @unique`, `terms Json`, `agreedAmount Int @default(0)`, `fanSignedAt DateTime?`, `creatorSignedAt DateTime?`, `createdAt`. 관계: `application`, `payments Payment[]`.
  - **선행 조건(SPEC-011)**: 본 SPEC의 결제는 `fanSignedAt != null` **그리고** `creatorSignedAt != null`(양측 서명 완료)일 때만 가능하다. 현재 코드(`lib/contracts.ts` `startPayment`)는 `fanSignedAt`만 가드하므로, 양측 서명 가드는 SPEC-011에서 도입됨을 전제로 참조한다(본 SPEC은 그 가드 위에 PG 흐름을 얹는다).
- **`Payment`** (`payments`): `id`, `membershipId String?`, `contractId String? @unique`, `postId String?`, `fanUserId`, `amount Int`, `feeKrw Int @default(0)`, `status PaymentStatus @default(PENDING)`, timestamps. 관계: `membership?`, `contract?`, `post?`, `fan`, `settlement?`.
  - **CRITICAL 갭**: 실제 스키마에는 **`provider`, `providerTxId`, 주문번호(`merchantUid`) 필드가 없다**. `PaymentResult.providerTxId`는 인터페이스 반환값일 뿐 DB에 영속화되지 않는다. PG 검증·콜백 대조·멱등성을 위해 **스키마 보완 필요**(§3 "스키마 보완 필요").
  - **`contractId @unique`**: 1계약 1결제를 DB 레벨에서 강제(SPEC-006 구현 노트). PG 흐름에서도 유지.
- **`PaymentStatus`** enum: `PENDING`, `PAID`, `RELEASED`, `REFUNDED`, `FAILED`. 본 SPEC은 `PENDING`(결제 요청 생성) → `PAID`(서버 검증 성공) 및 `PENDING`/(요청) → `FAILED`(검증 실패/사용자 취소) 전이를 다룬다.
- **`Settlement`** (`settlements`): `id`, `paymentId @unique`, `payout Int`, `status SettlementStatus @default(PENDING)`, timestamps.
- **`Program`** (`programs`): `priceKrw Int @default(0)`, `status ProgramStatus`. 검증 성공 시 `IN_PROGRESS`로 전환.
- **`Notification`** (`notifications`): `type String`, `message`, `linkUrl String?`. `PAYMENT_COMPLETED` 알림 생성.

### 스키마 보완 필요 (필수)

PG 검증·콜백 대조·멱등성을 위해 `Payment` 모델에 다음 필드를 추가한다(SPEC-006 §3에서 "추후 sandbox 확장 시 추가 권장"으로 명시했던 항목의 구체화).

1. **`Payment.provider String?`** (`@map("provider")`): 결제 수단 식별(`"portone"` | `"toss"` | `"mock"`). 폴백 시 `"mock"` 기록.
2. **`Payment.providerTxId String?`** (`@map("provider_tx_id")`): PG가 발급한 결제 고유 ID(PortOne `imp_uid` 등). 검증 응답으로 확정 후 저장. 멱등 처리·재조회 키.
3. **`Payment.merchantUid String? @unique`** (`@map("merchant_uid")`): 앱이 발급하는 **주문번호**. 결제 요청 생성 시점에 발급, 결제창·콜백·서버 검증 전 구간에서 동일 값으로 대조. `@unique`로 중복 주문/재사용 차단(멱등성). 형식 예: `order_{contractId}_{nonce}`.

마이그레이션 주의(SPEC-006 구현 노트 패턴 준수):
- 세 필드 모두 nullable로 추가하여 기존 레코드(`provider`/`providerTxId`/`merchantUid` 없는 Mock 결제)와 호환.
- `merchant_uid`의 `@unique`는 nullable이므로 Postgres가 다중 NULL을 허용 → 레거시 Mock 결제 레코드 영향 없음.
- 멱등 SQL로 작성해 `db push` drift된 라이브 DB와 fresh `migrate reset` 양쪽에 안전(SPEC-006 마이그레이션 전략 일관).

### 상태 전환 (PRD §14.3 Payment + PG 흐름)

| 상태 | 의미 | 전환 트리거 |
|---|---|---|
| (요청) | 주문번호 발급, 결제창 호출 직전 | `createPaymentRequest()` — `Payment(status=PENDING, merchantUid)` 생성(또는 트랜잭션 보류 토큰) |
| PENDING | 결제창 진행 중 / 검증 대기 | 결제창 호출 ~ 콜백 수신 사이 |
| PAID | **서버 검증 성공** — 플랫폼 보관(에스크로) | `verifyPayment()`에서 PG 단건 조회 결과가 `(merchantUid, amount, status=paid)` 일치 |
| FAILED | 검증 실패 / 금액 불일치 / 사용자 취소 / PG 미결제 | `verifyPayment()` 불일치 또는 콜백 실패 코드 |
| RELEASED | 완료 승인 후 정산 처리 | SPEC-008(범위 밖) |
| REFUNDED | 환불 | Won't |

- 본 SPEC이 다루는 전이: `(요청)/PENDING → PAID`(검증 성공), `(요청)/PENDING → FAILED`(검증 실패/취소). `RELEASED`/`REFUNDED`는 범위 밖.

## 4. 기능 요구사항 (EARS)

### Provider 선택 및 폴백

- **FR-001**: THE SYSTEM SHALL `PaymentProvider` 인터페이스(SPEC-006 `lib/payment/provider.ts`)를 확장한 `SandboxPaymentProvider` 어댑터를 `lib/payment/`에 제공해야 한다. 어댑터는 결제 요청 생성에 필요한 메타(주문번호·금액·상품명)를 산출하고, 콜백 이후 PG 단건 조회 API를 호출해 결제를 검증하는 책임을 갖는다.
- **FR-002**: WHEN 애플리케이션이 결제 Provider를 해석할 때, IF 필수 PG 환경 변수(§9의 `PAYMENT_PROVIDER` 및 해당 PG의 API 키/시크릿)가 모두 설정되어 있으면, THE SYSTEM SHALL `SandboxPaymentProvider`를 선택해야 한다.
- **FR-003**: WHILE 필수 PG 환경 변수가 하나라도 누락되어 있으면, THE SYSTEM SHALL `MockPaymentProvider`로 폴백하고(SPEC-006 동작 보존), 외부 PG 호출 없이 결제 흐름을 완료해야 한다(데모/CI/오프라인 안정성).
- **FR-004**: THE SYSTEM SHALL Provider 선택 로직(환경 변수 분기)을 단일 헬퍼(예: `resolvePaymentProvider()`)로 캡슐화하고, 호출부(`lib/contracts.ts` 등)가 구체 Provider 타입에 의존하지 않도록 해야 한다(NFR-005, 인터페이스 의존).

### 결제 요청 생성

- **FR-005**: WHEN 팬이 양측 서명이 완료된 계약에서 "결제하기" 액션을 호출하면, THE SYSTEM SHALL 고유 주문번호(`merchantUid`)를 발급하고, `Payment(contractId, fanUserId, amount=Contract.agreedAmount 또는 Program.priceKrw, feeKrw=Math.round(amount*0.1), status=PENDING, provider, merchantUid)`를 생성한 뒤, 클라이언트가 결제창을 호출하는 데 필요한 파라미터(주문번호·금액·상품명·콜백 URL 등)를 반환해야 한다.
- **FR-006**: IF 계약이 양측 서명 완료(`fanSignedAt != null AND creatorSignedAt != null`) 상태가 아니면, THE SYSTEM SHALL 결제 요청을 거부하고 400을 반환해야 한다(SPEC-011 선행 조건).
- **FR-007**: IF 동일 `contractId`에 대해 이미 `status IN (PAID, RELEASED)`인 `Payment`가 존재하면, THE SYSTEM SHALL 결제 요청을 차단하고 409를 반환해야 한다(1계약 1결제, SPEC-006 멱등성 유지).
- **FR-008**: IF `contractId`에 대해 이미 `status=PENDING`인 미완료 결제 요청이 존재하면, THE SYSTEM SHALL 새 주문번호를 중복 발급하지 않고 기존 `PENDING` 요청(또는 그 `merchantUid`)을 재사용하거나 만료 처리 후 단일 활성 요청만 유지해야 한다(중복 주문 방지).

### 결제창 호출 (클라이언트)

- **FR-009**: WHEN 결제 요청 생성이 성공하면, THE SYSTEM SHALL 클라이언트에서 PG SDK 결제창을 호출하고, 결제 완료/실패 후 PG가 앱의 콜백 경로(`/api/payments/callback` 또는 리다이렉트 URL)로 결과를 전달하도록 구성해야 한다.
- **FR-010**: THE SYSTEM SHALL 클라이언트가 전달받은 PG 결과(성공/실패, `merchantUid`, PG 거래 ID)를 **신뢰하지 않고**, 반드시 서버 측 검증(FR-011)을 거쳐 결제 상태를 확정해야 한다.

### 콜백 수신 및 서버 측 결제 검증

- **FR-011**: WHEN 앱이 PG 콜백/리다이렉트를 수신하면, THE SYSTEM SHALL 콜백에 포함된 PG 거래 ID로 **PG 단건 조회 API**를 호출하고, 다음을 모두 대조해야 한다: (a) 조회된 `merchantUid`가 서버에 저장된 주문번호와 일치, (b) 조회된 결제 금액이 `Payment.amount`와 정확히 일치, (c) PG 결제 상태가 "결제 완료(paid)". 셋 중 하나라도 불일치하면 검증 실패로 처리한다.
- **FR-012**: WHEN 서버 측 검증이 모두 성공하면, THE SYSTEM SHALL 단일 트랜잭션으로 다음을 수행해야 한다: `Payment.status=PAID` 및 `providerTxId` 확정, `Settlement(paymentId, payout=amount-feeKrw, status=PENDING)` 생성, `Program.status=IN_PROGRESS` 전환, 팬에게 `type="PAYMENT_COMPLETED"` `Notification` 생성. 어느 한 단계라도 실패하면 전체 롤백한다.
- **FR-013**: IF 서버 측 검증이 실패(금액 불일치/주문번호 불일치/PG 미결제/사용자 취소)하면, THE SYSTEM SHALL `Payment.status=FAILED`로 전환(또는 PENDING 유지 후 실패 기록)하고, `Settlement`/`Program` 전환과 알림을 수행하지 않아야 하며, 결제 실패 결과를 사용자에게 표시해야 한다.
- **FR-014**: IF 동일 `merchantUid`(또는 `contractId`)에 대해 콜백이 중복 수신되거나 검증이 재호출되면, THE SYSTEM SHALL 이미 `PAID`인 결제를 다시 처리(중복 `Settlement`/알림 생성)하지 않고 멱등하게 기존 결과를 반환해야 한다.
- **FR-015**: THE SYSTEM SHALL 폴백(`MockPaymentProvider`) 경로에서는 외부 PG 단건 조회 없이 SPEC-006과 동일하게 검증을 즉시 성공 처리(항상 PAID)하되, FR-012의 트랜잭션 부수효과는 동일하게 수행해야 한다.

### 보안 및 키 관리

- **FR-016**: THE SYSTEM SHALL PG API 키·시크릿을 환경 변수(`process.env`)에서만 읽고, 소스 코드·리포지토리·클라이언트 번들에 하드코딩하거나 노출하지 않아야 한다.
- **FR-017**: THE SYSTEM SHALL PG 시크릿(서버 전용 검증 키)을 클라이언트로 전송하지 않아야 하며, 결제 검증을 위한 PG 단건 조회는 서버 측에서만 수행해야 한다.
- **FR-018**: THE SYSTEM SHALL `.env.example`에 본 SPEC이 요구하는 모든 PG 관련 키 목록(값 없이)을 문서화해야 한다(§9).

### 접근 제어 및 결제 내역 조회

- **FR-019**: IF 결제 요청·검증 호출자가 해당 계약의 팬 본인(`application.userId`)이 아니면, THE SYSTEM SHALL 403을 반환해야 한다(SPEC-006 FR-011 일관).
- **FR-020**: IF 비로그인 사용자가 결제 요청 액션을 호출하면, THE SYSTEM SHALL 401을 반환해야 한다.
- **FR-021**: THE SYSTEM SHALL 팬이 자신의 결제 내역을 조회할 수 있는 페이지(`/dashboard/fan/payments` 또는 동등)를 제공하고, 각 결제의 상태(PENDING/PAID/FAILED)·금액·주문번호·일시를 표시해야 한다(RFP "결제 내역 조회 페이지").

## 5. 비기능 요구사항

- **NFR-001 (보안 — 키 분리)**: PG 키·시크릿은 환경 변수로만 관리한다. 리포지토리·클라이언트 번들·로그에 시크릿이 노출되지 않아야 한다(FR-016, FR-017). `.env`는 git-ignore 유지, `.env.example`에는 값 없는 키 이름만 둔다.
- **NFR-002 (서버 권위 검증)**: 결제 확정은 **클라이언트 응답이 아니라 서버 측 PG 단건 조회 결과**에 의해서만 이루어진다(FR-010, FR-011). 금액 비교는 정확 일치(부동소수 없이 정수 KRW 비교).
- **NFR-003 (트랜잭션 원자성)**: FR-012의 `Payment`/`Settlement`/`Program`/`Notification` 변경은 단일 Prisma `$transaction`으로 원자 처리한다(SPEC-006 NFR-001 일관).
- **NFR-004 (멱등성)**: `merchantUid @unique` + 상태 가드로 중복 결제·중복 콜백·중복 정산을 방지한다(FR-007, FR-008, FR-014). 동시 결제 경합 시 unique 위반(P2002)을 409로 매핑(SPEC-006 패턴 재사용).
- **NFR-005 (확장성 / 인터페이스 의존)**: 호출부는 `PaymentProvider` 인터페이스에만 의존하고, `SandboxPaymentProvider`·`MockPaymentProvider` 교체가 환경 변수 분기로만 이루어진다. 향후 PortOne↔Toss 교체 시 어댑터만 추가/교체하면 된다.
- **NFR-006 (수수료 계산)**: `feeKrw = Math.round(amount * 0.1)`, `payout = amount - feeKrw`(SPEC-006 NFR-003 동일 정책).
- **NFR-007 (테스트 가능성 — 외부 PG 모킹)**: 외부 PG 호출(결제창 호출은 클라이언트, 단건 조회는 서버)은 `SandboxPaymentProvider` 인터페이스 경계에서 모킹한다. 유닛 테스트는 (a) 폴백 경로(`MockPaymentProvider`)로 트랜잭션·멱등성·접근제어를 직접 검증하고, (b) sandbox 경로는 PG 단건 조회 함수를 모킹하여 금액 일치/불일치/미결제/중복 콜백 시나리오를 검증한다. 실제 PG 네트워크 호출은 테스트에서 발생시키지 않는다(`vi.mock`/`vi.hoisted`로 어댑터·HTTP 클라이언트 경계 모킹).
- **NFR-008 (데모 안정성)**: PG 환경 변수 미설정 환경(CI·로컬 기본·발표 백업)에서는 폴백으로 결제 흐름이 끊김 없이 동작해야 한다. 시드는 양측 서명 완료된 계약 1건을 포함해 sandbox/폴백 결제 흐름을 바로 시연할 수 있게 한다.
- **NFR-009 (관찰 가능성)**: 검증 실패(금액 불일치 등)는 시크릿을 제외한 안전한 컨텍스트(merchantUid, 기대 금액 vs 조회 금액, PG 상태)로 서버 로그에 기록하여 디버깅을 돕는다.

## 6. API / Server Action 명세

| 기능 | 식별자 | 메서드 | 경로/함수 | 권한 | 입/출력 요약 |
|---|---|---|---|---|---|
| 결제 요청 생성 | `createPaymentRequest` | POST | `/api/contracts/:id/payment` 또는 Server Action | 팬 본인(양측 서명 완료) | `{ contractId }` → `{ merchantUid, amount, productName, provider, paymentParams }`(결제창 호출용) |
| 결제 콜백/검증 | `verifyPayment` | POST/GET | `/api/payments/callback` (PG 리다이렉트/콜백 수신) | 공개(서버 검증) | PG 콜백 페이로드(`merchantUid`, PG 거래 ID) → 서버 단건 조회·대조 후 `{ status, paymentId }` |
| PG 단건 조회(내부) | `fetchPgPayment` | — | `lib/payment/sandbox-provider.ts`(서버 전용) | 내부 | `(providerTxId)` → `{ merchantUid, amount, status }`(PG 응답) |
| Provider 해석(내부) | `resolvePaymentProvider` | — | `lib/payment/provider.ts` 또는 인접 | 내부 | 환경 변수 분기 → `SandboxPaymentProvider \| MockPaymentProvider` |
| 결제 내역 조회 | — | GET | `/dashboard/fan/payments` 서버 컴포넌트 또는 `getFanPayments` | 팬 본인 | → 팬의 `Payment[]`(상태·금액·주문번호·일시) |

> 비고: 기존 SPEC-006 `startPayment`는 본 SPEC에서 `createPaymentRequest`(요청 생성, Mock 폴백 시 즉시 검증) + `verifyPayment`(sandbox 검증)로 분리·확장된다. 폴백 경로에서는 `createPaymentRequest` 내에서 검증까지 즉시 완료해 SPEC-006 호환 흐름을 유지할 수 있다.

## 7. UI / 페이지

| 경로 | 사용자 | 주요 컴포넌트 |
|---|---|---|
| `/contracts/[id]` | 팬 본인 / 크리에이터 소유자 | `ContractDetail`, `PayButton`(양측 서명 완료 시 활성), `PaymentWindowLauncher`(클라이언트 — PG SDK 결제창 호출), 검증 진행 중 `PaymentPending`, 성공 시 `PaymentSuccessCard`, 실패 시 `PaymentFailedNotice`(재시도 CTA) |
| `/api/payments/callback` | (PG 리다이렉트 대상) | 서버 라우트 — 검증 후 결과 페이지(`/contracts/[id]?paid=1` 또는 실패 쿼리)로 리다이렉트 |
| `/dashboard/fan/payments` | 팬 본인 | `PaymentHistory`(결제 목록, 상태 배지 PENDING/PAID/FAILED, 금액, 주문번호, 일시) |

## 8. 외부 시스템 연동

### 결제 흐름 (sandbox 경로)

```
[팬] "결제하기"
   │ (server) createPaymentRequest: merchantUid 발급, Payment(PENDING) 생성
   ▼
[클라이언트] PG SDK 결제창 호출 (merchantUid, amount, productName, 콜백 URL)
   │ 팬이 sandbox 테스트 결제 수행
   ▼
[PG] 결제창 종료 → 앱 콜백/리다이렉트로 결과 전달 (merchantUid, providerTxId)
   │
   ▼
[앱 /api/payments/callback] verifyPayment
   │ (server) PG 단건 조회 API 호출 (providerTxId)
   │ 대조: merchantUid 일치 AND amount 일치 AND status=paid
   ├─ 성공 → $transaction: Payment.PAID + Settlement + Program.IN_PROGRESS + Notification
   └─ 실패 → Payment.FAILED, 부수효과 없음, 실패 표시
```

### 콜백/리다이렉트 및 키 관리

- **콜백 경로**: `/api/payments/callback`(SPEC-006이 "향후 sandbox용"으로 예약해 둔 경로). PG 결제창 종료 후 리다이렉트(또는 POST 콜백)로 진입. 본 SPEC은 **리다이렉트 콜백 + 서버 단건 조회 검증**을 1차 확정 경로로 한다.
- **웹훅(보강 경로, 선택)**: PG가 제공하는 서버-투-서버 웹훅을 등록한 경우, 동일한 `verifyPayment` 검증 로직을 재사용하여 리다이렉트 누락 시 결제 상태를 보강 확정한다. 웹훅은 서명/시크릿 검증을 거친 뒤 멱등 처리(FR-014). 본 SPEC에서 웹훅은 필수가 아니며, 미구성 시 리다이렉트 경로만으로 동작한다.
- **키 관리**: PG 발급 API 키/시크릿은 환경 변수로만 주입(§9). 서버 전용 시크릿은 클라이언트 번들에 포함하지 않는다(`NEXT_PUBLIC_` 접두사 금지 — 서버 키에는 사용하지 않음).

## 9. 환경 변수 (`.env.example` 추가 항목)

`.env.example`에 아래 키들을 값 없이 추가한다(PortOne 권장 기준; Toss 채택 시 대응 키로 치환). 모든 키가 비어 있으면 `MockPaymentProvider`로 폴백한다(FR-003).

```
# ── PG Sandbox 결제 (SPEC-012) ──
# 결제 Provider 선택: "portone" | "toss" | (미설정 시 mock 폴백)
PAYMENT_PROVIDER=

# PortOne (구 아임포트) sandbox — 권장
# 클라이언트 결제창 식별자 (공개 가능 — 가맹점 식별 코드)
NEXT_PUBLIC_PORTONE_STORE_ID=
# 결제창 채널 키 (클라이언트, 공개 가능)
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=
# 서버 전용 API 시크릿 (단건 조회·검증용 — 절대 클라이언트 노출 금지)
PORTONE_API_SECRET=
# (선택) 웹훅 서명 검증용 시크릿
PORTONE_WEBHOOK_SECRET=

# (대안) Toss Payments sandbox 채택 시
# NEXT_PUBLIC_TOSS_CLIENT_KEY=   # 테스트 클라이언트 키 (test_ck_...)
# TOSS_SECRET_KEY=               # 테스트 시크릿 키 (test_sk_..., 서버 전용)
```

> `NEXT_PUBLIC_` 접두사는 **공개 가능한 클라이언트 식별자**(가맹점/채널/클라이언트 키)에만 사용한다. **서버 시크릿**(`PORTONE_API_SECRET`, `TOSS_SECRET_KEY`)에는 절대 `NEXT_PUBLIC_`을 붙이지 않는다(FR-017, NFR-001).

## 10. PG 선택 근거 (PortOne 권장)

본 SPEC은 **PortOne(구 아임포트)** 를 sandbox 결제 Provider 권장안으로 채택한다. Toss Payments는 대안으로 남긴다.

| 기준 | PortOne (권장) | Toss Payments (대안) |
|---|---|---|
| sandbox/테스트 키 | 테스트 채널·테스트 키로 즉시 sandbox 결제창 시연 가능 | 테스트 클라이언트/시크릿 키 제공 |
| 다중 PG 추상화 | 여러 PG사를 단일 SDK로 추상화 — RFP의 "PG 교체 가능" 의도에 부합 | 단일 PG(토스) 전용 |
| 인터페이스 정합 | 결제창 호출 + 서버 단건 조회 검증 패턴이 본 SPEC의 `createPaymentRequest`/`verifyPayment` 2단계와 자연스럽게 매핑 | 동일 2단계 패턴 지원(승인 API) |
| 도메인 적합성 | 한국 PG 생태계 표준, 데모/평가 환경에서 레퍼런스 풍부 | 단순 결제에 충분 |

권장 이유 요약: (1) `PaymentProvider` 인터페이스 뒤 어댑터 교체 비용이 가장 낮고(다중 PG 추상화), (2) "결제창 → 콜백 → 서버 단건 조회 검증" 흐름이 본 SPEC의 2단계 액션과 1:1로 매핑되며, (3) sandbox 테스트 키만으로 외부 비용·실거래 없이 전체 흐름을 시연·검증할 수 있다.

> 본 권장안은 어댑터 구현 세부(SDK 버전, 정확한 API 엔드포인트)를 강제하지 않는다. Run 단계에서 PortOne 또는 Toss 중 하나를 확정하되, `SandboxPaymentProvider` 인터페이스 경계(결제 요청 메타 산출 + 단건 조회 검증)는 동일하게 유지한다.

## 11. 인수 기준 (Acceptance Criteria)

- **AC-001**: Given PG 환경 변수(`PAYMENT_PROVIDER` + PG 키)가 모두 설정된 환경, When 결제 Provider를 해석하면, Then `SandboxPaymentProvider`가 선택된다.
- **AC-002**: Given PG 환경 변수가 하나라도 누락된 환경, When 결제 Provider를 해석하면, Then `MockPaymentProvider`로 폴백되고 외부 PG 호출 없이 결제가 완료된다.
- **AC-003**: Given 양측 서명(`fanSignedAt`·`creatorSignedAt`) 완료된 계약, When 팬이 `createPaymentRequest`를 호출하면, Then 고유 `merchantUid`가 발급되고 `Payment(status=PENDING, merchantUid, provider)`가 생성되며 결제창 호출 파라미터가 반환된다.
- **AC-004**: Given `creatorSignedAt`이 null(양측 서명 미완료)인 계약, When 팬이 `createPaymentRequest`를 호출하면, Then 400이 반환되고 `Payment`가 생성되지 않는다(SPEC-011 선행 조건).
- **AC-005**: Given sandbox 경로에서 결제창을 거쳐 콜백이 수신된 상황, When `verifyPayment`가 PG 단건 조회 결과 `(merchantUid 일치, amount 일치, status=paid)`를 확인하면, Then 단일 트랜잭션으로 `Payment.status=PAID`(+`providerTxId`), `Settlement(payout=amount-feeKrw, status=PENDING)`, `Program.status=IN_PROGRESS`, `PAYMENT_COMPLETED` 알림이 생성된다.
- **AC-006**: Given 콜백 페이로드의 금액(또는 PG 조회 금액)이 `Payment.amount`와 다른 상황, When `verifyPayment`가 실행되면, Then 검증 실패로 `Payment.status=FAILED`가 되고 `Settlement`/`Program` 전환·알림이 발생하지 않는다(금액 위·변조 차단, NFR-002).
- **AC-007**: Given PG 조회 결과 주문번호(`merchantUid`)가 서버 저장값과 불일치하는 상황, When `verifyPayment`가 실행되면, Then 검증 실패로 처리되고 결제가 확정되지 않는다.
- **AC-008**: Given 이미 `status=PAID`인 계약 결제, When 동일 `merchantUid`로 콜백이 중복 수신되거나 `verifyPayment`가 재호출되면, Then 중복 `Settlement`/알림 없이 멱등하게 기존 결과가 반환된다(FR-014).
- **AC-009**: Given 이미 `PAID` 결제가 있는 계약, When 팬이 다시 `createPaymentRequest`를 호출하면, Then 409가 반환되고 새 결제 요청이 생성되지 않는다(1계약 1결제).
- **AC-010**: Given 팬 F의 계약, When F가 아닌 사용자(다른 팬/크리에이터)가 결제 요청 또는 검증을 호출하면, Then 403이 반환된다.
- **AC-011**: Given 비로그인 사용자, When 결제 요청 액션을 호출하면, Then 401이 반환된다.
- **AC-012**: Given PG 시크릿 키, When 클라이언트 번들/응답을 점검하면, Then 서버 전용 시크릿(`PORTONE_API_SECRET`/`TOSS_SECRET_KEY`)이 포함되지 않는다(키는 환경 변수로만, `NEXT_PUBLIC_` 미사용 — FR-017).
- **AC-013**: Given `.env.example`, When 점검하면, Then 본 SPEC이 요구하는 모든 PG 키가 값 없이 문서화되어 있다(FR-018).
- **AC-014**: Given 검증 트랜잭션 도중 `Settlement` 생성 실패, When 트랜잭션이 종료되면, Then `Payment.PAID`·`Program` 전환이 모두 롤백된다(DB에 PAID 레코드가 남지 않음 — NFR-003).
- **AC-015**: Given 수수료 10% 정책, When 금액 35,000원 결제가 검증 성공하면, Then `feeKrw=3500`, `payout=31500`이 저장된다(NFR-006).
- **AC-016**: Given 팬 본인, When `/dashboard/fan/payments`에 접근하면, Then 자신의 결제 목록이 상태(PENDING/PAID/FAILED)·금액·주문번호·일시와 함께 표시된다(FR-021).
- **AC-017**: Given 외부 PG 단건 조회 함수가 모킹된 테스트, When 금액 일치/불일치/미결제/중복 콜백 시나리오를 실행하면, Then 각각 PAID/FAILED/FAILED/멱등 결과가 검증되며 실제 PG 네트워크 호출은 발생하지 않는다(NFR-007).
- **AC-018**: `npm run lint`, `npm run typecheck`, `npm run build`가 통과되고, 결제 검증·중복결제·서명 미완료 거부·폴백 분기에 대한 유닛 테스트가 통과된다.

## 12. 의존성 및 선행 SPEC

- **선행 SPEC (필수)**:
  - **SPEC-006** (계약/Mock 결제): `PaymentProvider` 인터페이스, `MockPaymentProvider`, `Payment`/`Settlement` 트랜잭션, 수수료 10% 정책, `contractId @unique` 멱등성, `/contracts/[id]` 페이지·`/api/payments/callback` 예약 경로의 골격을 제공. 본 SPEC은 이 골격을 확장한다.
  - **SPEC-011** (양측 전자 서명): 결제는 `fanSignedAt != null AND creatorSignedAt != null`일 때만 가능(FR-006, AC-004). 본 SPEC은 SPEC-011의 양측 서명 가드 위에 PG 흐름을 얹는다.
- **느슨한 의존**: SPEC-004(`Program.priceKrw`/`status`), SPEC-005(`ACCEPTED` 신청 → 계약 생성).
- **스키마 보완 선행 (필수)**: `Payment`에 `provider String?`, `providerTxId String?`, `merchantUid String? @unique` 추가(§3). 마이그레이션은 nullable·멱등 SQL로 작성(SPEC-006 전략 일관).
- **후행 SPEC (선택)**: 완료 승인 → `Payment.RELEASED`/`Settlement.RELEASED`(SPEC-008), 동일 어댑터를 멤버십(SPEC-003)·PAID 포스트(SPEC-009) 결제로 확대 적용(별도 SPEC).

## 13. 제외 사항 (Won't)

- 환불 API / `Payment.status=REFUNDED` 전환 — Won't(별도 SPEC).
- 반복/정기 결제, 빌링키 저장 결제 — Won't.
- 실거래(production) PG 키·실제 카드 승인 — sandbox 한정. 본 SPEC은 테스트 키·테스트 결제만 다룬다.
- 실제 은행 이체·관리자 정산 페이지 — sandbox 상태 전환으로 대체(SPEC-006 정책 일관).
- 멤버십(SPEC-003)·PAID 포스트(SPEC-009) 결제의 PG 전환 — 본 SPEC 범위 밖(어댑터 재사용으로 후속 적용 가능).
- 웹훅을 결제 확정의 유일 경로로 삼는 비동기 전용 설계 — 본 SPEC은 리다이렉트 콜백 + 서버 검증을 1차 경로로 하고 웹훅은 선택적 보강 경로로만 둔다.
- 다중 통화/해외 결제, 부분 결제·분할 결제 — MVP 범위 밖.
