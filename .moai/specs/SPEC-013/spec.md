# SPEC-013: 에스크로 완료(납품 요청·완료 승인) 및 상호 평가 양방향화

> SPEC-008(완료 처리 및 리뷰)을 확장한다. 본 SPEC은 SPEC-008의 골격을 RFP 에스크로(§3.6.3)와 상호 평가(§3.7)에 맞게 (1) 완료 승인 주체를 지불자(팬)로 재정의하고 "납품 요청" 단계를 추가하며, (2) 크리에이터→팬 리뷰를 더해 양방향 평가를 완성한다.

## 1. 개요

- **목적**: RFP 에스크로 4단계(선결제 → **납품 요청** → **완료 승인(지불자=팬)** → 수수료 10% 차감 지급)를 구현하고, 상호 평가를 양방향(팬→크리에이터, 크리에이터→팬)으로 확장한다. 양측 모두 별점(1~5)+텍스트+태그로 각 방향 1회·수정 불가 리뷰를 작성하며, 사용자 프로필에 평균 별점과 리뷰 목록을 노출한다.
- **배경**: `docs/RFP-GAP-ANALYSIS.md` §3, §5 P0 갭 #3("상호 평가 크리에이터→팬 미구현"), #5("에스크로 완료 승인 주체 재검토 — 지불자(팬) 확인 + 납품 요청 단계 추가"). RFP §3.6.3(에스크로: 선결제→플랫폼 보관→완료 승인 후 정산), §3.7(상호 평가). SPEC-008(완료/리뷰 골격)을 확장한다.

- **역할 반전에 따른 완료 승인 주체 재정의 (결정 근거)**:
  - RFP 원본은 **의뢰인(지불자)이 프로젝트를 등록**하고 프리랜서가 지원·납품하며, 의뢰인이 납품물을 검토 후 완료 승인한다.
  - ArtBridge는 **크리에이터가 프로그램을 등록**(`Program.creatorProfileId`)하고 **팬이 신청·선결제**한다(`docs/RFP-GAP-ANALYSIS.md` §1 "핵심 역할 반전"). 즉 도메인 소유자(크리에이터)와 지불자(팬)가 분리되어 있다.
  - SPEC-008은 편의상 **크리에이터(대금 수령자)가 완료 승인**하도록 구현했다. 이는 에스크로의 핵심 안전장치(지불자가 납품을 확인한 뒤에야 대금이 풀린다)를 우회한다 — 수령자가 자기 대금을 스스로 풀 수 있기 때문이다.
  - **결정**: 본 SPEC은 에스크로 의미를 회복하기 위해 **완료 승인 주체를 지불자인 팬으로 재정의**한다. 크리에이터는 작업 완료 후 **"납품 요청"**(`DELIVERY_REQUESTED`)만 수행하고, 팬이 납품물을 검토한 뒤 **"완료 승인"**으로 대금 릴리스를 트리거한다. 프로그램이 다수 참여자(팬)를 가지므로, 완료 승인은 **참여(계약/결제) 관계 단위**로 수행하고, 프로그램 전체의 `COMPLETED` 전환은 별도 정책으로 정의한다(§3 상태 모델 참조).

- **에스크로 4단계 (RFP §3.6.3 매핑)**:

  | 단계 | 주체 | 시스템 동작 | 관련 SPEC |
  |---|---|---|---|
  | 1. 선결제 | 팬(지불자) | `Payment.status=PAID`(플랫폼 보관), `Settlement.status=PENDING`, `Program.status=IN_PROGRESS` | SPEC-006 / SPEC-012 |
  | 2. 납품 요청 | 크리에이터(수령자) | 참여 관계를 `DELIVERY_REQUESTED`로 표시, 팬에게 알림 | **SPEC-013 (신규)** |
  | 3. 완료 승인 | **팬(지불자)** | 해당 참여의 `Payment.status=RELEASED`, `Settlement.status=RELEASED`, 상호 평가 요청 알림 | **SPEC-013 (재정의)** |
  | 4. 수수료 차감 지급 | 시스템 | 정산 `payout = amount - feeKrw`(수수료 10%, SPEC-006에서 산정), `Settlement.status=RELEASED`로 지급 확정 | SPEC-006 / SPEC-013 |

- **범위**:
  - **포함**:
    - 납품 요청 단계(크리에이터 → 해당 참여를 `DELIVERY_REQUESTED`로 전환, 팬 알림).
    - 완료 승인 주체 재정의(팬 = 지불자)와 그에 따른 `Payment/Settlement` RELEASED, 상호 평가 요청 알림.
    - 납품 요청 선행 가드(납품 요청 없이 완료 승인 거부).
    - 상호 평가 양방향(팬→크리에이터, 크리에이터→팬). 양측 별점(1~5)+텍스트+태그, 각 방향 1회·수정 불가.
    - 리뷰 자격: `COMPLETED`(또는 참여 단위 완료) + 결제 완료 참여 관계에 한정. 양방향 각각의 평가자/피평가자 정의.
    - 사용자 프로필(크리에이터·팬)에 평균 별점과 받은 리뷰 목록 노출.
    - 관련 알림(납품 요청 → 팬, 완료 승인 → 크리에이터, 상호 평가 요청).
  - **제외**:
    - 리뷰 수정/삭제 — RFP "수정 불가"(SPEC-008과 동일).
    - 환불(`Payment.status=REFUNDED`), 분쟁/이의 제기, 납품물 반려·재요청 루프 — 본 SPEC은 단방향 진행(요청→승인)만 다룬다.
    - 실제 PG sandbox 연동, 결제창/콜백 — SPEC-012(결제 완료) 범위.
    - 양측 전자 서명 — SPEC-011 범위(본 SPEC은 서명 완료를 전제).
    - 자동 완료 처리(기간 종료 후 자동 승인), 자동 납품 요청 — 본 SPEC은 명시적 액션만 다룬다.
    - 평점 조작 방지(검증·익명화), 신고/모더레이션 — MVP 밖.
    - 태그 사전 정의/집계 통계(키워드 클라우드) — 본 SPEC은 자유 태그 저장·표시까지만.

## 2. 사용자 스토리

- As a **크리에이터(수령자)**, I want **작업을 마친 뒤 참여한 팬에게 "납품 요청"을 보내**고, so that **팬이 납품물을 확인하고 완료 승인을 할 수 있다**.
- As a **팬(지불자)**, I want **납품 요청을 받은 뒤 납품물을 검토하고 "완료 승인"**을 하고, so that **에스크로에 보관된 대금이 정산 릴리스되고 안심하고 거래를 종료할 수 있다**.
- As a **팬(지불자)**, I want **완료 승인 없이 대금이 임의로 풀리지 않음**을 보장받고, so that **납품 전 결제금이 보호된다**.
- As a **팬**, I want **완료된 거래에 대해 크리에이터를 별점·텍스트·태그로 평가**하고, so that **다른 팬에게 정보를 남길 수 있다**.
- As a **크리에이터**, I want **완료된 거래에 대해 참여한 팬을 별점·텍스트·태그로 평가**하고, so that **팬의 참여 매너에 대한 상호 평가가 남는다**.
- As a **방문자/사용자**, I want **크리에이터와 팬 프로필에서 각자 받은 평균 별점과 리뷰 목록**을 보고, so that **거래 상대를 신뢰할 수 있다**.
- As a **사용자(양측)**, I want **각 방향(내가 상대를 평가)당 리뷰를 한 번만 작성**할 수 있고, so that **중복·조작 평가가 방지된다**.

## 3. 관련 모델 및 상태

### 관련 Prisma 모델 (실제 `prisma/schema.prisma` 기준)

- **`Program`**: `status ProgramStatus`. `COMPLETED` 전환 대상. `creatorProfileId`로 소유 크리에이터 식별.
- **`ProgramApplication`**: `status=ACCEPTED` + 결제 완료 신청이 납품 요청/완료 승인/리뷰의 단위. 본 SPEC의 "참여 관계"(팬 1명 ↔ 크리에이터 1명)는 `ProgramApplication`(+ `Contract`/`Payment`)으로 식별한다.
- **`Contract`** / **`Payment`** / **`Settlement`**: 완료 승인 시 해당 참여의 `Payment.status=RELEASED`, `Settlement.status=RELEASED` 전환. `Payment.contractId`로 참여를 역추적.
- **`Review`** (`reviews`):
  - 실제 스키마: `id`, `programId`, `userId`, `rating Int`, `comment String?`, `tags String[] @default([])`, `createdAt`. 관계: `program Program`, `user User`. 제약: `@@unique([programId, userId])`, `@@index([programId])`.
  - **현재 한계 (양방향 차단 요인)**: `userId`(작성자)만 있고 **피평가자 구분(`revieweeId`)·평가 방향이 없다**. `@@unique([programId, userId])`는 "한 프로그램에서 한 사용자가 1개 리뷰만 작성"을 의미한다. 양방향(팬→크리에이터, 크리에이터→팬)을 도입하면 한 프로그램에서 크리에이터(작성자)가 여러 팬을 각각 평가해야 하므로 **`userId` 단독 unique가 양방향에서 깨진다**(크리에이터가 프로그램당 1개만 쓸 수 있어 다수 팬 평가 불가). → **스키마 보완 필요**(아래 참조).
- **`User`** / **`CreatorProfile`**: 평균 별점·리뷰 목록 노출 대상. 양방향이므로 **팬(`User`)도 받은 리뷰 집계 대상**이 된다. 별점 캐시 필드는 선택(런타임 집계 허용).
- **`Notification`** (`type String`, `linkUrl String?`): 납품 요청·완료 승인·상호 평가 요청 알림. 문자열 타입이라 새 타입 즉시 사용 가능(`notification-types.ts` 상수만 추가).

### 스키마 보완 필요

> 본 SPEC은 SPEC-008(`@@unique([programId, userId])`, 단방향)에서 **방향·피평가자**를 도입하므로 `Review` 모델과 제약을 반드시 보완해야 한다. SPEC-008의 README 의사결정 #4("단방향, `revieweeId` 추가 안 함")를 본 SPEC이 명시적으로 **번복**한다(RFP §3.7 상호 평가 충족 위함).

1. **(필수) `Review` 피평가자·방향 도입**:
   - `Review.revieweeId String @map("reviewee_id")` 추가 — 피평가자(`User.id`). 작성자는 기존 `userId`(=reviewer), 피평가자는 `revieweeId`로 분리한다. `reviewee User @relation("ReviewReviewee", ...)` 역관계 추가, 기존 작성자 관계는 `reviewer User @relation("ReviewReviewer", ...)`로 명명 정리(또는 `userId` 유지 + `revieweeId` 신설).
   - **(택1) 방향 구분**:
     - 안 A(권장): `revieweeId`만 추가하고 방향은 "작성자 역할 vs 피평가자 역할"로 런타임 도출(작성자가 크리에이터면 크→팬, 팬이면 팬→크). 별도 enum 불필요, 스키마 변경 최소.
     - 안 B: `Review.direction ReviewDirection`(`enum ReviewDirection { FAN_TO_CREATOR, CREATOR_TO_FAN }`) 명시 컬럼 추가. 쿼리·필터가 명확해지나 enum 신설 비용.
   - 본 SPEC은 **안 A를 권장**(reviewer/reviewee의 역할로 방향이 결정되므로 중복 컬럼을 피함). Run 시 확정.

2. **(필수) unique 제약 변경 — 방향을 포함해 양방향에서 깨지지 않게**:
   - 기존 `@@unique([programId, userId])` → **`@@unique([programId, userId, revieweeId])`**로 변경.
     - 의미: "한 프로그램에서, 한 작성자(`userId`)가, 한 피평가자(`revieweeId`)에 대해 1개 리뷰만". 이로써 (a) 팬→크리에이터 1회, (b) 크리에이터→각 팬 1회가 각각 1개로 강제되며, 양방향·다대다(크리에이터 1 ↔ 팬 N)에서도 중복이 차단된다.
     - 안 B(방향 enum) 채택 시 대안: `@@unique([programId, userId, direction])`은 크리에이터가 프로그램당 1개 팬만 평가 가능해지므로 **부적합**. `revieweeId`를 포함한 제약이 정답이다.
   - `@@index([revieweeId])` 추가 — 피평가자별 받은 리뷰 조회용.

3. **(선택) `Review.rating` 범위·`tags`**: `tags String[]`는 이미 존재 → 양방향 모두 그대로 사용. `rating` 1~5 검증은 애플리케이션(`lib/validation/review.ts`)에서 수행.

4. **(필수) 납품 요청 상태 표현** — 둘 중 택1:
   - 안 A(권장): 참여 단위 시각 필드. `ProgramApplication.deliveryRequestedAt DateTime? @map("delivery_requested_at")`, `ProgramApplication.completionApprovedAt DateTime? @map("completion_approved_at")` 추가. 납품 요청 시 `deliveryRequestedAt` 세팅, 완료 승인 시 `completionApprovedAt` 세팅. "납품 요청 없이 완료 승인 거부"는 `deliveryRequestedAt != null` 가드로 구현. 멱등·디버깅 용이.
   - 안 B: `ProgramApplication`에 자체 상태 enum 또는 `Contract`/`Payment`에 단계 컬럼 추가. 상태 머신이 늘어나 복잡.
   - 본 SPEC은 **안 A를 권장**(시각 필드 2개). Run 시 확정.

5. **(선택) 알림 타입 상수**: `Notification.type`이 `String`이므로 `"DELIVERY_REQUESTED"`, `"COMPLETION_APPROVED"`, `"MUTUAL_REVIEW_REQUESTED"`를 `notification-types.ts`에 추가만 하면 됨(스키마 변경 불필요).

6. **(선택) 평균 별점 캐시**: `CreatorProfile.avgRating Float?`, (양방향이므로) `User.avgRating Float?`/`User.reviewCount Int?`. 없으면 런타임 `aggregate` 집계 허용(MVP 트레이드오프).

### 상태 전환

- **참여(에스크로) 단계** (`ProgramApplication` 시각 필드 기준, 보완 안 A):
  - `결제 완료(PAID)` → (크리에이터 납품 요청) → `deliveryRequestedAt` 세팅 → (팬 완료 승인) → `completionApprovedAt` 세팅 + `Payment.RELEASED` + `Settlement.RELEASED`
- **`Payment`**: `PAID → RELEASED` (완료 승인 시, 해당 참여만)
- **`Settlement`**: `PENDING → RELEASED` (완료 승인 시, 해당 참여만)
- **`Program`**: `IN_PROGRESS → COMPLETED`
  - 정책(택1, Run 시 확정): (a) 마지막 참여가 완료 승인되면 `COMPLETED` 자동 전환, 또는 (b) 결제 완료 참여가 모두 완료 승인되었을 때 `COMPLETED`. 본 SPEC은 **(b) "모든 결제 완료 참여가 완료 승인됨"**을 기준으로 한다(부분 완료는 `IN_PROGRESS` 유지). 단, `program-status.ts`의 `IN_PROGRESS → COMPLETED` 전이는 본 SPEC이 트리거하므로 화이트리스트 확장 필요.
- **리뷰**: 상태 머신 없음. 각 방향 1회 작성 후 변경 불가.

> 주의: `src/lib/program-status.ts`의 `ALLOWED_TRANSITIONS`는 현재 `IN_PROGRESS: []`(전이 없음)다. 본 SPEC의 완료 승인 트리거가 `IN_PROGRESS → COMPLETED`를 수행하려면 서비스 레이어에서 직접 전환하거나 화이트리스트를 보완해야 한다. SPEC-008은 `completeProgram` 서비스에서 직접 `update`로 전환했으므로 본 SPEC도 동일하게 서비스 레이어에서 처리한다(클라이언트 PATCH 경계와 분리).

## 4. 기능 요구사항 (EARS)

### 납품 요청 (크리에이터 → 팬)

- **FR-001**: WHEN 크리에이터(프로그램 소유자)가 `status=IN_PROGRESS`인 프로그램의 결제 완료 참여(`ACCEPTED` + `Payment.status=PAID`)에 대해 "납품 요청" 액션을 호출하면, THE SYSTEM SHALL 해당 참여를 납품 요청 상태(`deliveryRequestedAt=now()`)로 전환해야 한다.
- **FR-002**: WHEN 납품 요청이 처리되면, THE SYSTEM SHALL 해당 참여의 팬에게 `type="DELIVERY_REQUESTED"` `Notification`(완료 승인 화면 링크 포함)을 생성해야 한다.
- **FR-003**: IF 비소유 크리에이터 또는 팬이 납품 요청 액션을 호출하면, THE SYSTEM SHALL 403을 반환해야 한다.
- **FR-004**: IF 대상 참여가 결제 완료(`Payment.status=PAID`) 상태가 아니거나 프로그램이 `IN_PROGRESS`가 아니면, THE SYSTEM SHALL 납품 요청을 거부하고 400을 반환해야 한다.
- **FR-005**: IF 이미 납품 요청된(`deliveryRequestedAt != null`) 참여에 다시 납품 요청을 호출하면, THE SYSTEM SHALL 멱등 처리(중복 알림 미발송)하거나 409를 반환해야 한다(Run 시 택1, 기본: 멱등).

### 완료 승인 (팬 = 지불자)

- **FR-006**: WHEN 팬(해당 참여의 지불자)이 납품 요청된(`deliveryRequestedAt != null`) 본인 참여에 대해 "완료 승인" 액션을 호출하면, THE SYSTEM SHALL 단일 트랜잭션에서 다음을 수행해야 한다:
  - 해당 참여의 `Payment.status=RELEASED`
  - 해당 `Payment`에 연결된 `Settlement.status=RELEASED`
  - 해당 참여 `completionApprovedAt=now()`
- **FR-007**: IF 납품 요청 없이(`deliveryRequestedAt == null`) 완료 승인을 호출하면, THE SYSTEM SHALL 완료 승인을 거부하고 400을 반환해야 한다 (에스크로 순서 강제).
- **FR-008**: IF 해당 참여의 지불자(팬)가 아닌 사용자(다른 팬 또는 크리에이터)가 완료 승인을 호출하면, THE SYSTEM SHALL 403을 반환해야 한다.
- **FR-009**: WHEN 완료 승인이 처리되면, THE SYSTEM SHALL 크리에이터에게 `type="COMPLETION_APPROVED"` 알림과, 팬·크리에이터 양측에게 `type="MUTUAL_REVIEW_REQUESTED"`(또는 기존 `REVIEW_REQUESTED`) 상호 평가 요청 알림을 생성해야 한다.
- **FR-010**: WHEN 해당 프로그램의 모든 결제 완료 참여가 완료 승인되면, THE SYSTEM SHALL `Program.status=COMPLETED`로 전환해야 한다. 일부만 승인된 경우 `IN_PROGRESS`를 유지해야 한다.
- **FR-011**: IF 트랜잭션 도중 어느 단계(예: `Settlement` 갱신)가 실패하면, THE SYSTEM SHALL 전체를 롤백하고 500을 반환해야 한다 (`Payment.RELEASED`/완료 시각이 부분 커밋되지 않음).

### 상호 평가 — 양방향 리뷰

- **FR-012**: WHEN 완료 승인된 참여의 **팬**이 리뷰 폼(`rating` 1~5, `comment?`, `tags?`)을 제출하면, THE SYSTEM SHALL 새 `Review(programId, userId=팬, revieweeId=크리에이터의 User.id, rating, comment, tags)`(팬→크리에이터)를 생성해야 한다.
- **FR-013**: WHEN 완료 승인된 참여의 **크리에이터**가 특정 팬에 대해 리뷰 폼을 제출하면, THE SYSTEM SHALL 새 `Review(programId, userId=크리에이터의 User.id, revieweeId=팬, rating, comment, tags)`(크리에이터→팬)를 생성해야 한다.
- **FR-014**: IF 동일 `(programId, userId, revieweeId)`에 이미 `Review`가 존재하면, THE SYSTEM SHALL 재작성을 거부하고 409를 반환해야 한다 (각 방향·상대당 1회).
- **FR-015**: IF `rating`이 1~5 범위를 벗어나면, THE SYSTEM SHALL 검증 에러를 반환해야 한다.
- **FR-016**: IF 완료 승인되지 않은(또는 결제 미완료) 참여 관계에 대해 리뷰 작성을 시도하면, THE SYSTEM SHALL 거부해야 한다 — 자격 없는 작성자(비참여자, 미결제 팬)는 403, 완료 전(`completionApprovedAt == null`)이면 400.
- **FR-017**: IF 작성자가 자신의 참여 관계에 속하지 않은 상대(`revieweeId`)를 평가하려 하면(예: 크리에이터가 자기 프로그램에 참여하지 않은 팬을 평가), THE SYSTEM SHALL 403을 반환해야 한다.
- **FR-018**: THE SYSTEM SHALL 리뷰의 수정과 삭제를 허용하지 않아야 한다 (RFP "수정 불가"). 본 SPEC은 관련 액션을 제공하지 않는다.

### 리뷰·평점 표시 (양방향)

- **FR-019**: WHEN 사용자가 크리에이터 프로필(`/creators/[creatorId]`)에 접근하면, THE SYSTEM SHALL 해당 크리에이터(`User.id`)가 **피평가자(`revieweeId`)인 리뷰** 목록과 평균 별점을 표시해야 한다.
- **FR-020**: WHEN 사용자가 팬 프로필(또는 팬 마이페이지)에 접근하면, THE SYSTEM SHALL 해당 팬(`User.id`)이 **피평가자(`revieweeId`)인 리뷰** 목록과 평균 별점을 표시해야 한다.
- **FR-021**: THE SYSTEM SHALL 평균 별점을 해당 피평가자(`revieweeId`)에게 작성된 `Review.rating`의 산술 평균(소수점 1자리 반올림)으로 계산해야 한다. 받은 리뷰가 없으면 평점을 표시하지 않거나 "리뷰 없음"으로 표시한다.

## 5. 비기능 요구사항

- **NFR-001 (트랜잭션)**: FR-006의 완료 승인(`Payment.RELEASED` + `Settlement.RELEASED` + 시각 세팅 + 알림)은 단일 트랜잭션으로 원자적이어야 하며, 부분 실패 시 전체 롤백된다(SPEC-008 `completeProgram`의 `$transaction` 패턴 재사용).
- **NFR-002 (에스크로 순서 무결성)**: 완료 승인은 반드시 납품 요청(`deliveryRequestedAt != null`) 이후에만 허용된다. 순서 위반은 서버에서 차단한다(FR-007). 클라이언트 UI 비활성만으로는 불충분.
- **NFR-003 (권한 — 지불자/소유자 분리)**: 납품 요청 권한은 크리에이터(프로그램 소유자), 완료 승인 권한은 팬(해당 참여 지불자)으로 **분리**해 서버에서 판정한다. 역할 혼동(수령자가 자기 대금 릴리스) 방지가 본 SPEC의 핵심이다.
- **NFR-004 (리뷰 무결성)**: 각 방향·상대당 1회 리뷰는 DB unique 제약(`@@unique([programId, userId, revieweeId])`)으로 보장한다. 애플리케이션 사전 체크 + DB 제약 이중 차단(P2002 → 409 매핑)으로 레이스 컨디션을 막는다(SPEC-008 NFR-003 패턴 재사용).
- **NFR-005 (수정 불가)**: 리뷰 수정/삭제 액션은 API/UI 어디에도 노출되지 않는다(양방향 모두).
- **NFR-006 (ServiceResult 패턴)**: 본 SPEC의 서비스 함수는 SPEC-006/008의 `ReviewServiceResult<T>`(`{ ok: true, data } | { ok: false, status, error }`) 판별 유니온을 그대로 따른다. API 라우트는 결과를 HTTP 상태로 매핑한다.
- **NFR-007 (데모 안정성)**: 시드는 (a) 납품 요청된 참여, (b) 완료 승인되어 양방향 리뷰가 달린 `COMPLETED` 프로그램을 각각 최소 1개 포함해, 납품 요청·완료 승인·양방향 평점 표시가 빈 상태로 시작하지 않도록 한다.
- **NFR-008 (역할 반전 문서화)**: 완료 승인 주체 변경(크리에이터→팬)은 SPEC-008 대비 **동작 변경(breaking)**이므로, 마이그레이션/구현 노트에 변경 사유와 SPEC-008 기존 동작과의 차이를 기록한다.

## 6. API / Server Action 명세

| 기능 | 식별자(제안) | 메서드 | 경로/함수(제안) | 권한 | 입/출력 요약 |
|---|---|---|---|---|---|
| 납품 요청 | `requestDelivery` | POST | `/api/applications/:id/request-delivery` 또는 Server Action | 크리에이터(소유자) | → `{ deliveryRequestedAt, notifiedFan }` |
| 완료 승인 | `approveCompletion` | POST | `/api/applications/:id/approve-completion` 또는 Server Action | 팬(지불자) | → `{ releasedPayment, releasedSettlement, programStatus, mutualReviewRequested }` |
| 리뷰 작성(양방향) | `createReview` | POST | `/api/programs/:id/reviews` 또는 Server Action | 완료 승인된 참여의 팬 또는 크리에이터 | `{ revieweeId, rating: 1..5, comment?, tags? }` → `Review` |
| 받은 리뷰 목록·평점 | `getReceivedReviews(userId)` | — | 서버 유틸/컴포넌트 | 공개 | → `{ reviews: Review[], avg: Float \| null, count: Int }` |
| 참여 에스크로 상태 | `getEscrowState(applicationId)` | — | 서버 유틸/컴포넌트 | 팬 본인 / 크리에이터 소유자 | → `{ paid, deliveryRequestedAt, completionApprovedAt }` |

> 완료 승인 단위가 SPEC-008(프로그램 단위, `POST /api/programs/:id/complete`)에서 **참여 단위**(`/api/applications/:id/...`)로 바뀐다. 다중 참여자 일괄 승인이 아니라 팬 각자가 자기 참여를 승인한다. SPEC-008 라우트는 폐기 또는 크리에이터의 납품 요청 보조 경로로 재사용 결정(Run 시).

## 7. UI / 페이지

| 경로 | 사용자 | 주요 컴포넌트 |
|---|---|---|
| `/programs/[id]` (크리에이터 소유자 뷰) 또는 `/dashboard/creator/programs/[id]/participants` | 크리에이터 | 참여자별 `RequestDeliveryButton`(결제 완료 + 미요청 시 활성), 상태 배지(결제완료/납품요청/완료) |
| `/programs/[id]` (팬 참여자 뷰) 또는 `/dashboard/fan` | 팬 | `ApproveCompletionButton`(납품 요청됨 + 미승인 시 활성, 미요청 시 비활성), 납품 검토 안내 |
| `/programs/[id]` 리뷰 영역 | 완료 승인된 양측 | `ReviewForm`(별점 1~5, 코멘트, 태그) — 팬은 크리에이터를, 크리에이터는 각 팬을 평가. 이미 작성 시 "작성 완료" |
| `/creators/[creatorId]` 리뷰 섹션 | 공개 | `ReceivedReviewList`, `RatingSummary`(크리에이터가 받은 리뷰·평균) |
| 팬 프로필/마이페이지 리뷰 섹션 | 공개 또는 본인 | `ReceivedReviewList`, `RatingSummary`(팬이 받은 리뷰·평균) |

## 8. 인수 기준 (Acceptance Criteria)

### 납품 요청

- **AC-001**: Given 크리에이터 A의 `IN_PROGRESS` 프로그램 P에 결제 완료(PAID) 참여 팬 F1이 있을 때, When A가 F1 참여에 "납품 요청"을 호출하면, Then 해당 참여 `deliveryRequestedAt`이 세팅되고 F1에게 `"DELIVERY_REQUESTED"` 알림이 생성된다.
- **AC-002**: Given 비소유 크리에이터 B 또는 팬, When F1 참여에 납품 요청을 호출하면, Then 403이 반환된다.
- **AC-003**: Given 결제 미완료(PENDING) 참여, When 크리에이터가 납품 요청을 호출하면, Then 400이 반환되고 `deliveryRequestedAt`은 null로 유지된다.

### 완료 승인 (에스크로 순서·지불자 권한)

- **AC-004**: Given F1 참여가 **납품 요청되지 않은** 상태, When F1(팬)이 "완료 승인"을 호출하면, Then 400이 반환되고 `Payment.status`는 `PAID`로 유지된다 (납품 요청 없이 완료 승인 거부 — FR-007).
- **AC-005**: Given F1 참여가 납품 요청된 상태, When F1(팬, 지불자)이 "완료 승인"을 호출하면, Then 단일 트랜잭션에서 해당 `Payment.status=RELEASED`, 대응 `Settlement.status=RELEASED`, `completionApprovedAt` 세팅이 이뤄지고 크리에이터에게 `"COMPLETION_APPROVED"` 및 양측에 상호 평가 요청 알림이 생성된다.
- **AC-006**: Given F1 참여가 납품 요청된 상태, When **크리에이터 A(수령자) 또는 다른 팬**이 F1 참여의 완료 승인을 호출하면, Then 403이 반환된다 (지불자만 승인 가능 — NFR-003).
- **AC-007**: Given 완료 승인 트랜잭션 중 `Settlement` 갱신이 실패하면, When 트랜잭션이 종료되면, Then `Payment.status`와 `completionApprovedAt` 갱신이 모두 롤백된다 (부분 커밋 없음).
- **AC-008**: Given 프로그램 P에 결제 완료 참여 F1, F2가 있고 F1만 완료 승인된 경우, When 상태를 조회하면, Then `P.status`는 `IN_PROGRESS`를 유지한다. F2까지 완료 승인되면 `P.status=COMPLETED`로 전환된다 (FR-010).

### 상호 평가 양방향

- **AC-009**: Given F1 참여가 완료 승인됨, When F1(팬)이 `rating=5, comment="좋았어요", tags=["친절함"]`로 제출하면, Then `Review(programId=P, userId=F1, revieweeId=크리에이터 User.id, ...)`(팬→크리에이터)가 생성된다.
- **AC-010**: Given F1 참여가 완료 승인됨, When 크리에이터 A가 F1에 대해 `rating=4`로 제출하면, Then `Review(programId=P, userId=A의 User.id, revieweeId=F1, ...)`(크리에이터→팬)가 생성되고, 이는 AC-009의 팬→크리에이터 리뷰와 **별개로** 공존한다.
- **AC-011**: Given F1이 이미 크리에이터를 평가한 상태, When F1이 같은 프로그램에서 같은 크리에이터를 다시 평가하면, Then 409가 반환되고 새 레코드가 생성되지 않는다 (`@@unique([programId, userId, revieweeId])` — FR-014).
- **AC-012**: Given 크리에이터 A가 F1, F2를 각각 평가하려는 경우(다대다), When A가 F1과 F2에 각각 1회씩 제출하면, Then 두 리뷰가 모두 생성된다(같은 `(programId, userId=A)`라도 `revieweeId`가 달라 unique 위반이 아님). 이는 SPEC-008의 `@@unique([programId, userId])`로는 불가능했던 동작이다.
- **AC-013**: Given `rating=0` 또는 `rating=6` 입력, When 제출하면, Then 검증 에러가 반환된다.
- **AC-014**: Given 완료 승인되지 않은(또는 비참여) 사용자, When 리뷰 작성을 시도하면, Then 비참여자/미결제는 403, 완료 전이면 400이 반환된다 (FR-016).
- **AC-015**: Given 크리에이터 A가 자기 프로그램에 참여하지 않은 팬 X를 평가하려 할 때, When 제출하면, Then 403이 반환된다 (참여 관계 밖 평가 차단 — FR-017).
- **AC-016**: Given 작성된 리뷰(어느 방향이든), When 어떤 사용자가 수정/삭제를 시도하면, Then 해당 액션이 존재하지 않거나 405/403을 반환한다 (불변 — FR-018).

### 표시

- **AC-017**: Given 크리에이터 C가 받은 리뷰 2개(rating 4, 5)가 있을 때, When `/creators/[id]`를 조회하면, Then 평균 별점 "4.5"와 받은 리뷰 2개가 표시된다 (`revieweeId=C` 기준 집계 — FR-019, FR-021).
- **AC-018**: Given 팬 F1이 받은 리뷰 1개(rating 4)가 있을 때, When F1 프로필/마이페이지를 조회하면, Then 평균 별점 "4.0"과 받은 리뷰 1개가 표시된다 (`revieweeId=F1` 기준 — FR-020).
- **AC-019**: Given 받은 리뷰가 없는 사용자, When 프로필을 조회하면, Then 평점이 표시되지 않거나 "리뷰 없음"으로 표시된다 (에러 발생 금지).

### 품질 게이트

- **AC-020**: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`(또는 `vitest run`)가 통과된다. 본 SPEC 신규 테스트(납품 요청 없이 완료 승인 거부, 지불자 외 승인 거부, 비참여자 리뷰 거부, 양방향 중복 리뷰 거부, 다대다 리뷰 공존)가 포함된다.

## 9. 의존성 및 선행 SPEC

- **선행 SPEC**:
  - **SPEC-008** (완료/리뷰 골격) — 본 SPEC이 확장·일부 번복(완료 승인 주체, 단방향→양방향). `completeProgram`/`createReview` 패턴 재사용.
  - **SPEC-011** (양측 전자 서명) — 완료 승인 대상 참여는 서명 완료를 전제로 한다. 본 SPEC은 서명 자체를 다루지 않는다.
  - **SPEC-012** (결제 완료) — 에스크로 1단계(선결제 `PAID`)는 SPEC-012가 트리거. 본 SPEC은 2~4단계(납품 요청→완료 승인→지급)를 다룬다.
  - (간접) SPEC-004(`Program.status`), SPEC-005(`ACCEPTED` 참여), SPEC-006(`Payment`/`Settlement`/수수료 10% 산정).
- **스키마 보완 선행 (필수)**:
  - `Review.revieweeId` 추가 + `@@unique([programId, userId])` → `@@unique([programId, userId, revieweeId])`로 변경 + `@@index([revieweeId])`.
  - `ProgramApplication.deliveryRequestedAt`, `completionApprovedAt` 추가(보완 안 A).
  - `program-status.ts` `IN_PROGRESS → COMPLETED` 전이 처리(서비스 레이어 직접 전환 또는 화이트리스트 보완).
- **스키마 보완 (선택)**: `ReviewDirection` enum(안 B), `User.avgRating`/`CreatorProfile.avgRating` 캐시, 알림 타입 상수.
- **후행 SPEC**: 없음(에스크로·상호 평가 종점). 환불·분쟁은 별도 SPEC.

## 10. 제외 사항 (Won't)

- 리뷰 수정 및 삭제 — RFP "수정 불가"(양방향 모두).
- 환불(`Payment.status=REFUNDED`), 부분 환불, 분쟁/이의 제기 처리.
- 납품물 반려·재요청 루프(완료 승인 거부 후 재납품) — 본 SPEC은 단방향 진행만.
- 실제 PG sandbox 결제창·콜백 검증 — SPEC-012.
- 양측 전자 서명 흐름 — SPEC-011.
- 자동 납품 요청/자동 완료 승인(기간 종료 시) — 본 SPEC은 명시적 액션만. 자동화는 별도 스케줄러 SPEC.
- 평점 조작 방지(검증·익명화·이상 탐지), 신고/모더레이션 — MVP 밖.
- 태그 사전 정의·집계 통계(키워드 클라우드, 태그 필터) — 자유 태그 저장·표시까지만.
- 리뷰 미디어 첨부(사진/URL) — 범위 밖.

## 11. 구현 노트 (Implementation Notes)

> Run(SPEC-013) 완료 후 sync 단계에서 작성. 스키마 보완 채택안(방향 안 A/B, 납품 상태 안 A/B), `program-status.ts` 전이 처리 방식, SPEC-008 라우트 폐기/재사용 결정, 데모 안정성 시드 구성, 양방향 중복·다대다 리뷰 테스트 결과를 기록한다.

### 11.1 SPEC-008 대비 변경 요약 (작성 시점 명시)

- **완료 승인 주체**: 크리에이터(SPEC-008) → **팬=지불자**(본 SPEC). 에스크로 안전장치 회복(NFR-003, NFR-008).
- **승인 단위**: 프로그램 일괄(SPEC-008 `POST /api/programs/:id/complete`) → **참여 단위**(`/api/applications/:id/...`).
- **신규 단계**: 납품 요청(`DELIVERY_REQUESTED`)을 완료 승인 앞에 삽입(NFR-002).
- **리뷰 방향**: 단방향(SPEC-008, `@@unique([programId, userId])`) → **양방향 + `revieweeId`** + `@@unique([programId, userId, revieweeId])`. README 의사결정 #4를 본 SPEC이 명시적으로 번복.
