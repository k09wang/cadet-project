# SPEC-011: 금액 조율(합의 금액) 및 양측 전자 서명

## 1. 개요

- **목적**: 크리에이터와 팬이 계약 금액(`Contract.agreedAmount`)을 조율·합의하고, 양측(팬·크리에이터)이 각각 체크박스 동의로 전자 서명(`fanSignedAt`/`creatorSignedAt`)한 뒤에만 결제로 진행할 수 있도록 한다. 기존 SPEC-006(계약/Mock 결제)의 단측 서명·고정 금액 흐름을 확장한다. PRD RFP의 "금액 조율"(§3.6.1 권장 흐름)과 "양측 전자 서명"을 충족한다.
- **배경**:
  - `docs/RFP-GAP-ANALYSIS.md`의 **P0 갭 #1**(양측 전자 서명 미구현 — `creatorSignedAt`이 스키마에 존재하나 코드에서 미사용, 결제 가드가 `fanSignedAt`만 검사), **P0 갭 #4**(금액 조율 흐름 부재 — 합의 금액이 `program.priceKrw`로 고정).
  - SPEC-006은 `getOrCreateContract`에서 `agreedAmount = program.priceKrw`로 금액을 고정하고, `signContract`로 팬 단측만 서명하며, `startPayment`는 `fanSignedAt`만 가드한다. 본 SPEC은 이 세 지점을 확장한다.
  - RFP §2.3(금액 합의 결렬 시나리오), §3.6.1(금액 조율 권장 흐름).
- **범위**:
  - **포함**:
    - 금액 조율: 크리에이터가 신청 수락 시(또는 계약 단계에서) 합의 금액을 제시(`Contract.agreedAmount`) → 팬이 동의/거부. 합의된 금액이 결제·계약서에 반영됨을 보장(RFP §3.6.1 권장 흐름, 1회 제시·1회 응답의 단방향 협상).
    - 금액 합의 결렬 정책: 팬이 합의 금액을 거부하면 해당 신청을 거절 처리하고, 프로그램을 계약 체결 직전 단계(`RECRUITING` 등)로 복귀시킨다(권장 정책으로 명시).
    - 양측 전자 서명: 팬·크리에이터 양측의 체크박스 동의로 `fanSignedAt`/`creatorSignedAt`를 각각 설정. 양측 서명 완료(`fanSignedAt && creatorSignedAt`) 시에만 결제 가능하도록 `startPayment` 가드 강화.
    - 관련 알림: 합의 금액 제시→팬, 동의/거부→크리에이터, 양측 서명 완료→팬·크리에이터.
    - 권한: 합의 금액 제시·크리에이터 서명은 프로그램 소유 크리에이터만, 팬 동의·팬 서명·결제는 팬 본인만.
  - **제외**:
    - 다회차 가격 협상(역제안·재협상 루프) — 본 SPEC은 크리에이터 1회 제시 + 팬 1회 응답(동의/거부)의 단방향 협상만 다룬다(RFP §4.3 Won't 정합).
    - 결제 트랜잭션 자체(`Payment`/`Settlement` 생성, `Program.IN_PROGRESS` 전환) — SPEC-006이 담당. 본 SPEC은 결제 진입 가드(양측 서명 선행)까지만 정의한다.
    - 결렬 시 자동거절된 타 지원자(SPEC-005 `AUTO_REJECTED`)의 복구 — 미복구 정책으로 명시.
    - 실제 PG 연동, 환불 — SPEC-006 제외 사항 승계.
    - 계약서 PDF 생성·서명 이미지·법적 효력 검증 — MVP 범위 밖.

## 2. 사용자 스토리

- As a **크리에이터**, I want **신청 수락 시 합의 금액을 제시**할 수 있고, so that **프로그램 기본가와 다른 금액으로도 계약을 맺을 수 있다**.
- As a **팬**, I want **제시된 합의 금액을 확인하고 동의하거나 거부**할 수 있고, so that **납득한 금액으로만 계약을 진행할 수 있다**.
- As a **팬**, I want **합의 금액이 마음에 들지 않으면 거부**할 수 있고, so that **원치 않는 금액의 계약에 묶이지 않는다**(거부 시 신청은 거절되고 프로그램은 모집 단계로 복귀).
- As a **팬**과 **크리에이터**, I want **각자 약관에 체크박스로 동의(서명)**하고, so that **양측 합의가 명시적으로 기록된다**.
- As a **팬**, I want **양측 서명이 모두 끝나야 결제 버튼이 활성화**되는 것을 보고, so that **상대방 미서명 상태에서 결제가 진행되지 않는다**.

## 3. 관련 모델 및 상태

### 관련 Prisma 모델 (실제 `prisma/schema.prisma` 기준)

- **`Program`** (`programs`): `priceKrw Int @default(0)`(기본가), `status ProgramStatus`. 결렬 시 복귀 대상 상태(`RECRUITING`).
- **`ProgramApplication`** (`program_applications`): `status ProgramApplicationStatus`. 합의 금액 거부 시 `REJECTED`로 전환. `Contract`와 1:1.
- **`ProgramApplicationStatus`** enum: `PENDING`, `ACCEPTED`, `REJECTED`, `AUTO_REJECTED`, `CANCELLED` ✓. 결렬은 기존 `REJECTED`를 재사용한다.
- **`Contract`** (`contracts`):
  - 실제 스키마: `id`, `applicationId @unique`, `terms Json`, `agreedAmount Int @default(0)`, `fanSignedAt DateTime?`, `creatorSignedAt DateTime?`, `createdAt`. 관계: `application ProgramApplication`, `payments Payment[]`.
  - **본 SPEC은 기존 필드를 그대로 재사용**한다:
    - 합의 금액: `agreedAmount`(SPEC-006은 생성 시 `program.priceKrw`로 초기화). 본 SPEC은 크리에이터가 제시 시 갱신 가능하게 한다.
    - 팬 서명: `fanSignedAt`(체크박스 동의 시 설정).
    - 크리에이터 서명: `creatorSignedAt`(체크박스 동의 시 설정 — **SPEC-006에서 미사용이던 필드를 본 SPEC에서 활성화**).
- **`ProgramStatus`** enum: `DRAFT`, `RECRUITING`, `CLOSED`, `CONTRACTING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` ✓. 결렬 시 `CONTRACTING → RECRUITING` 복귀(권장).
- **`Notification`** (`notifications`): `type String`, `message`, `linkUrl String?`. 합의·서명 관련 알림 타입 추가(문자열).

### 금액 합의 상태 표현 (스키마 보완 필요 — 선택)

본 SPEC은 가능한 한 기존 필드를 재사용하나, "합의 금액이 제시되었으나 팬이 아직 응답하지 않음"과 "팬이 동의함"을 구분하려면 상태 추적이 필요하다. 다음 두 가지 안을 제시한다.

1. **(권장) 기존 필드 + `terms Json` 임베드**: 별도 스키마 변경 없이 `Contract.terms` JSON에 합의 상태 메타를 임베드한다.
   - `terms.amountProposedAt: ISO string | null` — 크리에이터가 합의 금액을 제시한 시각.
   - `terms.amountAgreedAt: ISO string | null` — 팬이 합의 금액에 동의한 시각.
   - 합의 상태 판정 규칙:
     - 미제시: `amountProposedAt == null`
     - 제시됨·팬 미응답: `amountProposedAt != null && amountAgreedAt == null`
     - 합의됨: `amountAgreedAt != null`
   - 팬 동의(`amountAgreedAt` 설정)는 팬 서명(`fanSignedAt`)과 동시에 처리하는 것을 권장한다(동의 = "이 금액으로 서명"). 이 경우 별도 `amountAgreedAt`는 `fanSignedAt`로 대체 가능하다.
   - 장점: 마이그레이션 불필요, SPEC-006의 `terms Json` 스냅샷 패턴과 일관.
   - 단점: 타입 안전성이 약함(JSON 필드), 쿼리 필터링 불가.

2. **(대안) enum 신설 + 컬럼 추가**: `enum ContractStatus { DRAFTING, AMOUNT_PROPOSED, AMOUNT_AGREED, AMOUNT_REJECTED, SIGNED }`와 `Contract.status ContractStatus` 추가. 결렬 시 `AMOUNT_REJECTED` 기록 후 신청 거절.
   - 장점: 명시적 상태 머신, 쿼리·인덱싱 가능, 결렬 이력 보존.
   - 단점: 마이그레이션 필요, SPEC-006 흐름과 컬럼 정합 추가 작업.

> **결정 위임**: Run 단계에서 안 1(권장, 무마이그레이션)을 우선 시도하되, 결렬 이력 보존·상태 쿼리 요구가 강하면 안 2를 채택한다. 본 SPEC의 FR/AC는 안 1을 기준으로 기술하되, 안 2 채택 시 동일 의미로 매핑한다.

### 상태 전환

| 대상 | 전이 | 트리거 |
|---|---|---|
| `Contract.agreedAmount` | `program.priceKrw`(초기) → 크리에이터 제시 금액 | 크리에이터 합의 금액 제시 |
| 합의 상태(`terms` 또는 `ContractStatus`) | 미제시 → 제시됨 → (합의됨 \| 거부됨) | 제시 / 팬 동의 / 팬 거부 |
| `Contract.fanSignedAt` | null → 시각 | 팬 체크박스 동의 서명 |
| `Contract.creatorSignedAt` | null → 시각 | 크리에이터 체크박스 동의 서명 |
| `ProgramApplication.status` | `ACCEPTED` → `REJECTED` | 팬이 합의 금액 거부 |
| `Program.status` | `CONTRACTING` → `RECRUITING` | 합의 결렬(권장 복귀 정책) |
| 결제 진입 | 잠금 → 허용 | `fanSignedAt && creatorSignedAt` 충족 시 |

## 4. 기능 요구사항 (EARS)

### 금액 조율 (합의 금액)

- **FR-001**: WHEN 프로그램 소유 크리에이터가 `ACCEPTED` 신청의 계약에 대해 합의 금액 제시 액션(`{ amount: Int }`)을 호출하면, THE SYSTEM SHALL `Contract.agreedAmount`를 제시 금액으로 갱신하고 합의 상태를 "제시됨"으로 기록(`terms.amountProposedAt` 설정 또는 `ContractStatus.AMOUNT_PROPOSED`)해야 한다.
- **FR-002**: IF 제시 금액이 양의 정수가 아니면(`amount <= 0` 또는 비정수), THE SYSTEM SHALL 제시를 거부하고 400을 반환해야 한다.
- **FR-003**: IF 합의 금액 제시 액션을 호출한 사용자가 프로그램 소유 크리에이터가 아니면, THE SYSTEM SHALL 403을 반환해야 한다.
- **FR-004**: WHEN 팬 본인이 제시된 합의 금액에 동의 액션(`{ agreed: true }`)을 호출하면, THE SYSTEM SHALL 합의 상태를 "합의됨"으로 기록(`terms.amountAgreedAt` 또는 `fanSignedAt`)하고, 이후 결제 금액이 `Contract.agreedAmount`로 확정됨을 보장해야 한다.
- **FR-005**: IF 합의 금액이 제시되지 않은 상태(`amountProposedAt == null`)에서 팬이 동의/거부 액션을 호출하면, THE SYSTEM SHALL 400을 반환해야 한다.
- **FR-006**: WHEN 합의 금액이 제시되거나 갱신되면, THE SYSTEM SHALL 팬에게 합의 금액 제시 알림(예: `type="CONTRACT_AMOUNT_PROPOSED"`)을 생성해야 한다.

### 금액 합의 결렬

- **FR-007**: WHEN 팬 본인이 제시된 합의 금액에 거부 액션(`{ agreed: false }`)을 호출하면, THE SYSTEM SHALL 단일 트랜잭션에서 다음을 수행해야 한다:
  - 해당 `ProgramApplication.status`를 `REJECTED`로 전환
  - 합의 결렬 사실 기록(`terms.amountRejectedAt` 또는 `ContractStatus.AMOUNT_REJECTED`)
  - 프로그램이 `CONTRACTING` 상태이면 `RECRUITING`으로 복귀(권장 정책)
- **FR-008**: THE SYSTEM SHALL 합의 결렬로 신청을 거절할 때, 이전에 `AUTO_REJECTED` 처리된 다른 지원자(SPEC-005)를 복구하지 않아야 한다(미복구 정책 — 본 SPEC 명시).
- **FR-009**: WHEN 합의가 결렬(팬 거부)되면, THE SYSTEM SHALL 크리에이터에게 결렬 알림(예: `type="CONTRACT_AMOUNT_REJECTED"`)을 생성해야 한다.
- **FR-010**: IF 이미 `fanSignedAt`이 설정(서명 완료)되었거나 결제가 완료된 계약에 대해 거부 액션이 호출되면, THE SYSTEM SHALL 거부를 차단하고 409를 반환해야 한다(서명·결제 이후 결렬 불가).

### 양측 전자 서명

- **FR-011**: WHEN 팬 본인이 약관 동의 체크박스를 선택한 뒤 팬 서명 액션(`{ agreed: true }`)을 호출하면, THE SYSTEM SHALL `Contract.fanSignedAt`을 현재 시각으로 설정해야 한다.
- **FR-012**: WHEN 프로그램 소유 크리에이터가 약관 동의 체크박스를 선택한 뒤 크리에이터 서명 액션(`{ agreed: true }`)을 호출하면, THE SYSTEM SHALL `Contract.creatorSignedAt`을 현재 시각으로 설정해야 한다.
- **FR-013**: IF 동의 체크박스가 선택되지 않은 상태(`agreed=false`)에서 팬 또는 크리에이터 서명 액션이 호출되면, THE SYSTEM SHALL 400을 반환하고 해당 서명 필드를 설정하지 않아야 한다.
- **FR-014**: IF 합의 금액이 합의되지 않은 상태(팬 미동의)에서 팬 서명 액션이 호출되면, THE SYSTEM SHALL 400을 반환해야 한다(금액 합의 선행). 단, 팬 동의와 팬 서명을 단일 액션으로 통합하는 구현(안 1 권장)에서는 동의=서명으로 처리되어 본 조건이 자동 충족된다.
- **FR-015**: THE SYSTEM SHALL 팬 서명은 팬 본인만, 크리에이터 서명은 프로그램 소유 크리에이터만 수행할 수 있도록 강제하고, 위반 시 403을 반환해야 한다.
- **FR-016**: IF 서명 대상 계약이 양측 서명을 마친 뒤 동일 서명 액션이 재호출되면, THE SYSTEM SHALL 멱등하게 처리(이미 설정된 서명 시각을 유지)하거나 409로 거부해야 한다(중복 서명 무해).

### 결제 진입 가드 (SPEC-006 startPayment 강화)

- **FR-017**: WHILE `Contract.fanSignedAt`과 `Contract.creatorSignedAt` 중 하나라도 null이면, THE SYSTEM SHALL 결제 진입을 차단해야 한다. 결제 시작(`startPayment`) 시 양측 서명(`fanSignedAt && creatorSignedAt`)을 가드로 검사하고, 미충족 시 400을 반환해야 한다.
- **FR-018**: WHILE 양측 서명이 완료되지 않은 동안, THE SYSTEM SHALL 결제 버튼(UI)을 비활성화해야 한다.
- **FR-019**: WHEN 양측 서명이 모두 완료되면, THE SYSTEM SHALL 결제로 진행할 때 `Contract.agreedAmount`(합의 금액)를 결제 금액으로 사용해야 한다(SPEC-006 `startPayment`의 `amount`는 `agreedAmount`를 우선).

### 알림

- **FR-020**: WHEN 양측 서명이 모두 완료되면, THE SYSTEM SHALL 팬과 크리에이터에게 서명 완료 알림(예: `type="CONTRACT_SIGNED"`)을 생성해야 한다.
- **FR-021**: THE SYSTEM SHALL 본 SPEC에서 추가하는 알림 타입(`CONTRACT_AMOUNT_PROPOSED`, `CONTRACT_AMOUNT_REJECTED`, `CONTRACT_SIGNED`)을 `lib/notification-types.ts`의 `NOTIFICATION_TYPES` 상수와 `buildNotificationMessage`/`notificationHref` 헬퍼에 추가하여, 메시지와 링크가 일관되게 생성되도록 해야 한다.

### 접근 제어 (공통)

- **FR-022**: IF 계약의 `application.userId !== currentUser.id`(팬 본인 아님)이고 프로그램 소유 크리에이터도 아니면, THE SYSTEM SHALL 합의/서명 조회·액션을 403으로 거부해야 한다(SPEC-006 `resolveAccess` 패턴 재사용).

## 5. 비기능 요구사항

- **NFR-001 (트랜잭션 원자성)**: FR-007(결렬: 신청 거절 + 프로그램 복귀 + 알림)은 단일 Prisma `$transaction`으로 원자 처리하며, 부분 실패 시 전체 롤백된다(SPEC-006 패턴 승계).
- **NFR-002 (서버 권한 판정)**: 합의 금액 제시·동의·거부·서명·결제 권한은 모두 서버에서 판정한다. UI는 서버가 내려준 상태(제시됨/합의됨/서명 여부/소유자)로 버튼 표시만 제어한다.
- **NFR-003 (멱등성)**: 합의 금액 제시는 마지막 제시값으로 갱신(덮어쓰기)되며, 서명은 이미 설정된 시각을 보존(재설정 금지)한다.
- **NFR-004 (기존 흐름 비파괴)**: 본 SPEC은 SPEC-006의 `getOrCreateContract`/`signContract`/`startPayment`를 확장하되, 기존 계약·결제 데이터와 호환되어야 한다. `creatorSignedAt`이 null인 레거시 계약은 결제 가드 강화(FR-017)로 인해 크리에이터 서명을 추가로 요구한다(시드/마이그레이션에서 기존 데이터 보정 필요 — §10 참조).
- **NFR-005 (데모 안정성)**: 시드는 (a) 합의 금액 제시 전 계약, (b) 합의·양측 서명 완료 후 결제 직전 계약을 각각 1건 이상 포함해, 발표 중 "금액 제시→동의→양측 서명→결제" 흐름과 "거부→복귀" 흐름을 즉시 시연할 수 있도록 한다.
- **NFR-006 (금액 무결성)**: 결제 금액은 항상 `Contract.agreedAmount`(합의된 최종 금액)를 단일 출처로 사용하며, 클라이언트가 전달한 금액을 신뢰하지 않는다.

## 6. API / Server Action 명세

SPEC-006의 `lib/contracts.ts` ServiceResult 패턴과 `/api/contracts/*` 라우트 컨벤션을 따른다.

| 기능 | 식별자(제안) | 메서드 | 경로/함수(제안) | 권한 | 입/출력 요약 |
|---|---|---|---|---|---|
| 합의 금액 제시 | `proposeAmount` | PATCH | `/api/contracts/:id/amount` 또는 Server Action | 프로그램 소유 크리에이터 | `{ amount: number }` → `{ agreedAmount }` |
| 합의 금액 동의 | `agreeAmount` | PATCH | `/api/contracts/:id/amount/agree` 또는 Server Action | 팬 본인 | `{ agreed: true }` → `{ amountAgreedAt }` (팬 서명과 통합 가능) |
| 합의 금액 거부(결렬) | `rejectAmount` | PATCH | `/api/contracts/:id/amount/reject` 또는 Server Action | 팬 본인 | `{ agreed: false }` → `{ applicationStatus, programStatus }` |
| 팬 서명 | `signContract`(확장) | PATCH | `/api/contracts/:id/sign` (기존 SPEC-006) | 팬 본인 | `{ agreed: true }` → `{ fanSignedAt }` |
| 크리에이터 서명 | `signContractAsCreator` | PATCH | `/api/contracts/:id/sign/creator` 또는 Server Action | 프로그램 소유 크리에이터 | `{ agreed: true }` → `{ creatorSignedAt }` |
| 결제 시작(가드 강화) | `startPayment`(확장) | POST | `/api/contracts/:id/payment` (기존 SPEC-006) | 팬 본인(양측 서명 완료) | `{ provider: "mock" }` → SPEC-006 결과. 양측 미서명 시 400 |

> 식별자/경로는 제안이며, Run 단계에서 기존 `lib/contracts.ts` 구조(단일 모듈 내 함수)와 `/api/contracts/[id]/*` 라우트 관례에 맞춰 확정한다.

## 7. UI / 페이지

SPEC-006의 `/contracts/[id]` 페이지를 확장한다.

| 경로 | 사용자 | 주요 컴포넌트(제안) |
|---|---|---|
| `/contracts/[id]` (팬 뷰) | 팬 본인 | `AmountProposalCard`(제시된 합의 금액 표시, 동의/거부 버튼 — 제시 전이면 "금액 제시 대기"), `AgreementCheckbox` + `SignButton`(팬 서명), 양측 서명 상태 배지(`팬 서명 완료`/`크리에이터 서명 대기` 등), `PayButton`(양측 서명 완료 시에만 활성) |
| `/contracts/[id]` (크리에이터 뷰) | 프로그램 소유 크리에이터 | `AmountProposalForm`(합의 금액 입력·제시 — 미제시 시), `AgreementCheckbox` + `SignButton`(크리에이터 서명), 양측 서명 상태 배지, 결제/팬 서명은 읽기 전용 |
| `/dashboard/creator/programs/[id]/...` | 크리에이터 소유자 | 합의/서명 진행 상태 요약(선택, SPEC-007 연동) |

- 제시 전: 팬에게 "크리에이터가 금액을 제시할 때까지 대기" 표시, 크리에이터에게 금액 입력 폼 표시.
- 제시 후: 팬에게 동의/거부 버튼, 크리에이터에게 "팬 응답 대기" 표시.
- 합의 후: 양측에 각자 서명 체크박스/버튼. 양측 서명 완료 시 팬에게 결제 버튼 활성.

## 8. 인수 기준 (Acceptance Criteria)

- **AC-001**: Given `ACCEPTED` 신청의 계약, When 프로그램 소유 크리에이터가 `proposeAmount({ amount: 50000 })`를 호출하면, Then `Contract.agreedAmount=50000`으로 갱신되고 합의 상태가 "제시됨"으로 기록되며 팬에게 `CONTRACT_AMOUNT_PROPOSED` 알림이 생성된다.
- **AC-002**: Given 계약, When 비소유 사용자(다른 크리에이터 또는 팬)가 `proposeAmount`를 호출하면, Then 403이 반환되고 `agreedAmount`가 변경되지 않는다.
- **AC-003**: Given 계약, When 크리에이터가 `amount=0`(또는 음수)으로 제시하면, Then 400이 반환되고 `agreedAmount`가 변경되지 않는다.
- **AC-004**: Given 합의 금액이 제시되지 않은 계약, When 팬이 동의 또는 거부 액션을 호출하면, Then 400이 반환된다.
- **AC-005**: Given 합의 금액 `50000`이 제시된 계약, When 팬 본인이 `agreeAmount({ agreed: true })`를 호출하면, Then 합의 상태가 "합의됨"으로 기록되고(또는 `fanSignedAt` 설정) 이후 결제 금액 기준이 `50000`으로 확정된다.
- **AC-006**: Given 합의 금액 `50000`이 제시되고 프로그램이 `CONTRACTING` 상태인 계약, When 팬 본인이 `rejectAmount({ agreed: false })`를 호출하면, Then 단일 트랜잭션에서 `ProgramApplication.status=REJECTED`, `Program.status=RECRUITING`으로 전환되고 크리에이터에게 `CONTRACT_AMOUNT_REJECTED` 알림이 생성된다.
- **AC-007**: Given 합의 결렬로 신청이 거절될 때 이전에 `AUTO_REJECTED`된 다른 지원자가 존재하면, When 거부가 처리되면, Then 해당 `AUTO_REJECTED` 신청은 복구되지 않고 그대로 유지된다.
- **AC-008**: Given 이미 `fanSignedAt`이 설정된(서명 완료) 계약, When 팬이 `rejectAmount`를 호출하면, Then 409가 반환되고 신청·프로그램 상태가 변경되지 않는다.
- **AC-009**: Given 합의된 계약, When 팬 본인이 체크박스 선택 후 팬 서명 액션을 호출하면, Then `fanSignedAt`이 설정되고 `creatorSignedAt`이 null이면 결제 버튼은 비활성 상태로 유지된다.
- **AC-010**: Given 합의된 계약, When 프로그램 소유 크리에이터가 체크박스 선택 후 크리에이터 서명 액션을 호출하면, Then `creatorSignedAt`이 설정된다.
- **AC-011**: Given 체크박스 미선택(`agreed=false`) 상태, When 팬 또는 크리에이터 서명 액션을 호출하면, Then 400이 반환되고 해당 서명 필드는 null로 유지된다.
- **AC-012**: Given 팬 서명만 완료(`fanSignedAt` 설정, `creatorSignedAt` null)된 계약, When 팬이 `startPayment`를 호출하면, Then 400이 반환되고 `Payment`가 생성되지 않는다.
- **AC-013**: Given 크리에이터 서명만 완료(`creatorSignedAt` 설정, `fanSignedAt` null)된 계약, When 팬이 `startPayment`를 호출하면, Then 400이 반환된다.
- **AC-014**: Given 양측 서명이 모두 완료된(`fanSignedAt && creatorSignedAt`) 계약, When 팬 본인이 `startPayment`를 호출하면, Then SPEC-006 결제 트랜잭션이 정상 진행되고 결제 금액은 `Contract.agreedAmount`로 처리된다.
- **AC-015**: Given 양측 서명이 모두 완료되면, When 서명 완료 시점이 트리거되면, Then 팬과 크리에이터 모두에게 `CONTRACT_SIGNED` 알림이 생성된다.
- **AC-016**: Given 팬 F가 아닌 사용자, When F의 계약에 대해 팬 서명/금액 동의/결제 액션을 호출하면, Then 403이 반환된다. Given 비소유 크리에이터, When 크리에이터 서명/금액 제시 액션을 호출하면, Then 403이 반환된다.
- **AC-017**: `npm run lint`, `npm run typecheck`, `npm run build`, `vitest run`이 통과된다(기존 SPEC-006/008 테스트 비회귀 포함).

## 9. 의존성 및 선행 SPEC

- **선행 SPEC**:
  - SPEC-005(신청·수락/거절·알림): `ACCEPTED` 신청과 `AUTO_REJECTED` 상태, `Notification`/알림 헬퍼 전제.
  - SPEC-006(계약·Mock 결제): `getOrCreateContract`/`signContract`/`startPayment`, `Contract.agreedAmount`/`fanSignedAt`/`creatorSignedAt` 필드, `terms Json` 스냅샷, `resolveAccess` 권한 패턴, `ServiceResult` 유니온 전제. 본 SPEC이 직접 확장한다.
- **스키마 보완**: 안 1(권장) 채택 시 **마이그레이션 불필요**(`terms Json` 임베드 + 기존 `agreedAmount`/`fanSignedAt`/`creatorSignedAt` 재사용). 안 2 채택 시 `ContractStatus` enum + `Contract.status` 컬럼 추가 마이그레이션 필요.
- **후행 SPEC**:
  - SPEC-012(결제): 본 SPEC이 강화한 양측 서명 가드와 `agreedAmount` 확정 금액에 의존한다(결제는 양측 서명 완료 + 합의 금액 기준).
  - SPEC-013(완료/리뷰): 결제 완료(본 SPEC의 가드를 통과한 결제) 이후 완료 처리·정산 릴리스에 의존한다.

  > SPEC-006의 후행으로 명시된 SPEC-007/008과의 관계: 본 SPEC은 SPEC-006과 SPEC-007/008 사이의 계약 단계를 보강한다. 결제·완료 흐름(SPEC-012/013, 기존 SPEC-006 결제 + SPEC-008 완료)은 본 SPEC의 양측 서명·합의 금액을 전제로 한다.

- **트레이서빌리티**:

  | 출처 | 본 SPEC 매핑 |
  |---|---|
  | RFP-GAP-ANALYSIS P0 갭 #1(양측 전자 서명) | FR-011~FR-020, AC-009~AC-015 |
  | RFP-GAP-ANALYSIS P0 갭 #4(금액 조율) | FR-001~FR-006, AC-001~AC-005 |
  | RFP §2.3(금액 합의 결렬) | FR-007~FR-010, AC-006~AC-008 |
  | RFP §3.6.1(금액 조율 권장 흐름) | FR-001~FR-006, FR-019 |
  | SPEC-006 `startPayment`(가드 강화) | FR-017~FR-019, AC-012~AC-014 |

## 10. 제외 사항 (Won't)

- **다회차 가격 협상** — 크리에이터 역제안·팬 재협상 루프. 본 SPEC은 1회 제시 + 1회 응답(동의/거부)만 다룬다(RFP §4.3 Won't).
- **결렬 시 자동거절 지원자 복구** — `AUTO_REJECTED`된 타 지원자를 결렬과 함께 되살리지 않는다(FR-008, AC-007).
- **결제 트랜잭션 내부** — `Payment`/`Settlement` 생성, `Program.IN_PROGRESS` 전환, 수수료 계산은 SPEC-006 소관. 본 SPEC은 결제 진입 가드와 확정 금액 전달까지만 정의한다.
- **법적 효력 있는 전자서명** — 서명 이미지, 인증서, 타임스탬프 공증, 계약서 PDF 생성. 본 SPEC은 체크박스 동의 + 서명 시각 기록만 다룬다.
- **실제 PG/sandbox 연동·환불** — SPEC-006 제외 사항 승계.
- **금액 협상 채팅/메시지 스레드** — 자유 텍스트 협의 UI는 범위 밖(단방향 제시·응답만).

## 11. 구현 노트 (Sync 시점 기록)

> Run(SPEC-011) 완료 후 sync 단계에서 작성. 합의 상태 표현 안(1/2) 채택 결과, `signContract`/`startPayment` 확장 방식, 레거시 계약(`creatorSignedAt=null`) 보정 처리, 추가된 알림 타입, AC↔구현 파일 매핑을 기록한다.

- **합의 상태 표현 결정**: (안 1 `terms Json` 임베드 / 안 2 `ContractStatus` enum 중 채택안 기록)
- **레거시 보정**: SPEC-006에서 생성된 `creatorSignedAt=null` 계약에 대한 시드/마이그레이션 보정 방식 기록(NFR-004).
- **결제 가드 강화 지점**: `startPayment`의 `fanSignedAt`-only 검사를 `fanSignedAt && creatorSignedAt`로 변경한 라인 기록(FR-017).
- **알림 타입 추가**: `notification-types.ts`에 추가한 `CONTRACT_AMOUNT_PROPOSED`/`CONTRACT_AMOUNT_REJECTED`/`CONTRACT_SIGNED` 메시지·href 기록(FR-021).
- **품질 게이트**: `npm run lint`/`typecheck`/`build`/`vitest run` 결과 기록(AC-017).
