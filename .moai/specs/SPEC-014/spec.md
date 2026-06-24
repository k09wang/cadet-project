# SPEC-014: 유저플로우 정합 보완 (멤버십 관리 · AI 추천 정합 · 커뮤니티 진입점)

> 유저플로우(`ArtBridge 창작자-팬 후원 커뮤니티 MVP_유저플로우_2026-06-21.md`) 대비 누락·불일치 3건을 하나의 SPEC으로 묶어 보완한다. 본 SPEC은 신규 도메인을 추가하지 않고, 기존 멤버십(SPEC-003)·AI 추천(SPEC-010)·커뮤니티(SPEC-007) 구현 위에서 (1) 멤버십 플랜 관리 화면+진입점을 채우고, (2) AI 추천을 유저플로우대로 멤버십 생성 화면에도 연결하며, (3) 대시보드/탐색홈→커뮤니티 진입 동선을 보강한다. 요구사항(REQ)은 작업 단위로 그룹화한다.

## HISTORY

- 2026-06-21: 최초 작성. `보완계획-유저플로우-2026-06-21.md`의 확정 결정(작업1 삭제 차단, 작업2 A안, 작업3 A안)을 EARS SPEC으로 변환. 작업 1·2·3을 단일 SPEC으로 통합(REQ 그룹화).

## 1. 개요

- **목적**: 유저플로우 정합성을 회복하는 3개 보완 작업을 한 SPEC으로 수행한다.
  - **작업 1 (멤버십 관리, n8)**: 멤버십 플랜의 목록/수정/삭제 관리 화면과 크리에이터 대시보드 진입점을 신설한다. 생성 화면(`memberships/new`)만 존재하던 동선의 끊김을 해소한다.
  - **작업 2 (AI 추천 정합, n8→n10)**: 유저플로우상 AI 가격·혜택 추천은 멤버십 플랜에 연결되나 실제 구현은 프로그램 생성에만 존재한다. 멤버십 생성 화면에 AI 추천(가격+혜택 중심)을 추가해 정합화한다.
  - **작업 3 (커뮤니티 진입점, n40/n41)**: 커뮤니티는 스튜디오 공개 페이지(`creators/[creatorId]`)의 탭으로 이미 구현되어 있다. 빠진 대시보드(n5)·탐색홈(n23)→커뮤니티 진입 동선(링크)만 보강한다.
- **배경**: `보완계획-유저플로우-2026-06-21.md`(2026-06-21 사용자 승인). 기준 유저플로우 문서 노드 n8(멤버십)·n10(AI 추천)·n40/n41(커뮤니티). 본 SPEC은 6/21 기능 Freeze(데모 안정화) 정책 하에서 "유저플로우 대비 누락 동선 보완"으로 한정한다.

- **확정 결정 (재논의 금지, 2026-06-21 사용자 승인)**:

  | # | 항목 | 결정 |
  |---|---|---|
  | 1 | 작업 1 삭제 정책 | 활성 `Membership`이 있는 플랜은 **DELETE 차단(409)** + UI 안내. soft/hard delete 미적용 |
  | 2 | 작업 2 방향 | **A안 확정** — 멤버십 생성 화면에도 AI 추천 추가 |
  | 3 | 작업 3 방향 | **A안 확정** — 진입 동선(링크)만 보강. 글로벌 커뮤니티 허브 신설 안 함 |

- **범위**:
  - **포함 (작업 1)**: `listMembershipPlansByCreator` 쿼리, 멤버십 관리 목록 페이지, 플랜 수정 페이지, `PATCH`/`DELETE` API(본인 검증 + 활성 멤버 보유 시 삭제 차단), 대시보드 진입 링크.
  - **포함 (작업 2)**: 멤버십용 AI 추천 함수(가격+혜택 중심), 멤버십 AI 추천 API, 멤버십 생성 화면 클라이언트 래핑(추천→가격·혜택 폼 주입), Mock 폴백 유지.
  - **포함 (작업 3)**: `StudioTabs`의 `?tab=community` 초기 탭 진입 지원, 크리에이터 대시보드 "내 커뮤니티" 링크, 팬 대시보드 "커뮤니티" 진입.
  - **제외**: §10 참조 (글로벌 커뮤니티 허브, soft/hard delete, AI 추천 모델 교체, 멤버십 결제 변경 등).

## 2. 사용자 스토리

- As a **크리에이터**, I want **대시보드에서 멤버십 관리로 진입해 내 플랜 목록을 보고**, so that **생성뿐 아니라 수정·삭제까지 한 화면에서 관리할 수 있다**. (작업 1)
- As a **크리에이터**, I want **활성 멤버가 있는 플랜은 삭제가 막히고 안내를 받고**, so that **가입자가 있는 플랜을 실수로 지워 가입 관계가 끊기지 않는다**. (작업 1)
- As a **크리에이터**, I want **멤버십 플랜 생성 화면에서도 AI에게 가격·혜택 추천을 받고**, so that **프로그램과 동일하게 멤버십도 추천 기반으로 빠르게 작성할 수 있다**. (작업 2)
- As a **크리에이터**, I want **대시보드에서 내 스튜디오 커뮤니티 탭으로 바로 이동하고**, so that **커뮤니티 관리 진입이 끊기지 않는다**. (작업 3)
- As a **팬**, I want **탐색/대시보드에서 커뮤니티로 이어지는 동선을 보고**, so that **가입한 스튜디오의 커뮤니티를 쉽게 찾아갈 수 있다**. (작업 3)

## 3. 관련 모델 및 상태

### 관련 Prisma 모델 (실제 `prisma/schema.prisma` 기준)

- **`MembershipPlan`** (`membership_plans`): `id`, `creatorProfileId`, `title`, `description String?`, `priceKrw Int`, `createdAt`, `updatedAt`. 관계: `creatorProfile CreatorProfile`, `memberships Membership[]`. 작업 1 목록/수정/삭제 단위.
- **`Membership`** (`memberships`): `id`, `userId`, `planId`, `startedAt`, ... 관계: `plan MembershipPlan`. 작업 1 삭제 차단 판정 대상 — `plan`에 연결된 `Membership` 레코드 존재 여부로 "활성 멤버 보유"를 판정한다(SPEC-003: `status` 필드 없음, 레코드 존재 기반).
- **`CreatorProfile`**: `id`로 크리에이터를 식별. 작업 1 목록 조회 키(`creatorProfileId`), 작업 3 커뮤니티 탭 링크 대상(`/creators/{profileId}?tab=community`).
- **`CommunityPost`** (`community_posts`): 작업 3은 이 모델을 **읽기/변경하지 않는다**. 진입 동선(링크)만 추가하므로 커뮤니티 데이터 모델은 SPEC-007 그대로 유지된다.

### 스키마 보완 필요

- **없음**. 본 SPEC은 신규 모델·필드·enum·제약을 추가하지 않는다. 모든 작업은 기존 스키마 위에서 동작한다(SPEC-003/007/010이 이미 필요한 모델을 정의함).
- 작업 1 삭제 차단은 `prisma.membership.count({ where: { planId } })`(또는 `findFirst`) 런타임 집계로 판정한다 — 추가 컬럼 불필요.

### 상태 전환

- **멤버십 플랜 수정/삭제**: 상태 머신 없음. `MembershipPlan` 레코드의 CRUD만 수행. 삭제는 hard delete가 아니라 **활성 멤버 보유 시 거부(409)**, 미보유 시에만 실제 `delete` 수행.
- **AI 추천 / 커뮤니티 진입**: 상태 전환 없음(읽기·폼 주입·라우팅 동선).

## 4. 기능 요구사항 (EARS)

### 작업 1 — 멤버십 플랜 관리 페이지 + 진입점

- **REQ-1-001 (Event-driven)**: WHEN 크리에이터가 멤버십 관리 페이지(`/dashboard/creator/memberships`)에 접근하면, THE SYSTEM SHALL `listMembershipPlansByCreator(creatorProfile.id)`로 본인 플랜을 `createdAt` 내림차순으로 조회해 카드 목록(제목·가격·설명)과 "플랜 생성" 링크를 표시해야 한다.
- **REQ-1-002 (Unwanted)**: IF 비크리에이터(팬 또는 비로그인)가 멤버십 관리 페이지에 접근하면, THE SYSTEM SHALL `requireRole("CREATOR")`로 접근을 차단(리다이렉트)해야 한다.
- **REQ-1-003 (State-driven)**: WHILE 로그인한 크리에이터가 `CreatorProfile`을 보유하지 않은 상태이면, THE SYSTEM SHALL 플랜 목록 대신 안내 문구(대시보드 프로필 미보유 안내 패턴 재사용)를 표시해야 한다.
- **REQ-1-004 (Event-driven)**: WHEN 크리에이터가 특정 플랜의 "수정" 액션으로 수정 페이지(`/dashboard/creator/memberships/[id]/edit`)에 진입하면, THE SYSTEM SHALL 해당 플랜의 현재 값(`title`/`priceKrw`/`description`)을 `MembershipPlanForm`에 초기값으로 주입해 표시해야 한다.
- **REQ-1-005 (Event-driven)**: WHEN 크리에이터가 본인 플랜에 대해 `PATCH /api/membership-plans/[id]`를 호출하면, THE SYSTEM SHALL `membershipPlanUpdateSchema`(partial)로 검증 후 해당 `MembershipPlan`을 수정하고 갱신된 레코드를 반환해야 한다.
- **REQ-1-006 (Unwanted)**: IF 비소유 크리에이터 또는 비크리에이터가 플랜 `PATCH`/`DELETE`를 호출하면, THE SYSTEM SHALL 비로그인 401 → 비크리에이터/타인 403의 권한 순서(`programs/[id]/route.ts` 패턴)로 거부해야 한다.
- **REQ-1-007 (Unwanted)**: IF 크리에이터가 **활성 `Membership`이 1건 이상 존재하는** 플랜에 대해 `DELETE`를 호출하면, THE SYSTEM SHALL 삭제를 차단하고 **409**를 반환해야 한다 (확정 결정 #1, soft/hard delete 미적용).
- **REQ-1-008 (Event-driven)**: WHEN 크리에이터가 활성 멤버가 **없는** 본인 플랜에 대해 `DELETE`를 호출하면, THE SYSTEM SHALL 해당 `MembershipPlan`을 실제 삭제(`delete`)하고 성공 응답을 반환해야 한다.
- **REQ-1-009 (Event-driven)**: WHEN 크리에이터 대시보드(`/dashboard/creator`)가 로드되면, THE SYSTEM SHALL 액션 그리드에 "멤버십 관리" → `/dashboard/creator/memberships` 링크를 표시해야 한다.

### 작업 2 — AI 가격·혜택 추천 위치 정합 (멤버십 생성 화면)

- **REQ-2-001 (Ubiquitous)**: THE SYSTEM SHALL 멤버십용 AI 추천 함수(`suggestMembership(input)` 신규 또는 `suggestProgram` 입력 타입 확장)를 제공하고, 멤버십 특성에 맞게 **가격(`suggestedPrice`)과 혜택(`benefits`) 중심** 결과를 반환해야 한다(프로그램의 주차 구성은 멤버십 추천에 포함하지 않는다).
- **REQ-2-002 (Event-driven)**: WHEN 크리에이터가 멤버십 AI 추천 API(`POST /api/membership-plans/ai-suggest`)를 호출하면, THE SYSTEM SHALL `programs/ai-suggest/route.ts` 권한 흐름(비로그인 401 → 비크리에이터 403 → 입력검증 400 → 추천 200)을 동일하게 적용하고 멤버십 입력 스키마로 검증해야 한다.
- **REQ-2-003 (Event-driven)**: WHEN 크리에이터가 멤버십 생성 화면에서 "AI 추천 받기"를 실행하고 결과를 반영하면, THE SYSTEM SHALL 추천된 가격을 `MembershipPlanForm`의 `priceKrw`에, 혜택을 `description`에 주입해야 한다(`NewProgramClient`의 remount `rev` 패턴 참고, 폼 상태만 갱신하고 DB에 저장하지 않음).
- **REQ-2-004 (Ubiquitous)**: THE SYSTEM SHALL 멤버십 생성 제출을 기존 방식(Server Action `createPlanAction` → `POST /api/membership-plans`)으로 유지해야 한다 — 폼 주입만 클라이언트(`NewMembershipClient`)로 전환하고 제출 경로는 변경하지 않는다.
- **REQ-2-005 (Unwanted)**: IF AI 추천 호출 중 외부 모델 오류가 발생하면, THE SYSTEM SHALL Mock 폴백 결과를 반환해야 하며 예외를 화면에 throw하거나 키/내부 정보를 노출해서는 안 된다(NFR 참조).
- **REQ-2-006 (Unwanted)**: THE SYSTEM SHALL 기존 프로그램 AI 추천(`/api/programs/ai-suggest`, `AiSuggestPanel`, `NewProgramClient`)의 동작을 회귀시키지 않아야 한다.

### 작업 3 — 커뮤니티 진입점 추가

- **REQ-3-001 (Event-driven)**: WHEN 사용자가 `/creators/[creatorId]?tab=community`로 접근하면, THE SYSTEM SHALL `StudioTabs`의 초기 활성 탭을 커뮤니티 탭으로 설정해 표시해야 한다(미지원 시 쿼리/초기 탭 처리 추가).
- **REQ-3-002 (Event-driven)**: WHEN 크리에이터 대시보드(`/dashboard/creator`)가 로드되면, THE SYSTEM SHALL "내 커뮤니티" → `/creators/{profileId}?tab=community` 링크를 표시해야 한다.
- **REQ-3-003 (Event-driven)**: WHEN 팬 대시보드(`/dashboard/fan`)가 로드되면, THE SYSTEM SHALL 둘러보기 섹션에 "커뮤니티" 진입(가입 멤버십 스튜디오의 커뮤니티 탭 또는 `/creators` 안내)을 표시해야 한다.
- **REQ-3-004 (Unwanted)**: THE SYSTEM SHALL 진입 동선 추가가 기존 스튜디오 탭(소개/포스트/멤버십/클럽/커뮤니티) 동작과 커뮤니티 데이터(`CommunityPost`, `/api/community-posts`)를 회귀시키지 않아야 한다.

## 5. 비기능 요구사항

- **NFR-001 (코드 컨벤션 유지)**: 모든 변경은 기존 컨벤션(서버 컴포넌트 + Server Action + `/api/*` fetch, shadcn UI, Tailwind, 한국어 UI 카피)을 유지한다. 신규 쿼리(`memberships.ts`)는 `queries/community.ts` 스타일(짧은 함수 + 한국어 주석)을 따른다.
- **NFR-002 (AI Mock 폴백)**: 멤버십 AI 추천은 외부 키 부재·오류 시에도 예외를 던지지 않고 Mock 결과를 반환한다(SPEC-010 `suggestProgram` NFR 동일 패턴). API 응답에 키/스택 등 내부 정보를 노출하지 않는다.
- **NFR-003 (삭제 차단 무결성)**: 활성 멤버 보유 플랜의 삭제 차단(REQ-1-007)은 서버(API 라우트/서비스 레이어)에서 판정한다. 클라이언트 버튼 비활성만으로는 불충분하다.
- **NFR-004 (권한 분리)**: 멤버십 `PATCH`/`DELETE`는 본인(`creatorProfileId` 일치) 검증을 서버에서 수행한다(`programs/[id]/route.ts` 패턴 재사용).
- **NFR-005 (테스트)**: 신규/변경 모듈에 코로케이션 테스트를 추가한다 — 쿼리(`memberships.test.ts`, `vi.hoisted` mock 패턴), API(`route.test.ts`), 클라이언트(`NewMembershipClient.test.tsx`), 작업 3 관련 테스트 갱신. 각 작업 후 `npm run typecheck && npm run lint && npm run test`가 통과한다.
- **NFR-006 (커밋 단위)**: 작업 1 → 작업 2 → 작업 3 순서로 작업 단위별 커밋(최소 3 커밋)을 수행한다.
- **NFR-007 (회귀 방지)**: 작업 2는 프로그램 AI 추천을, 작업 3은 스튜디오 탭/커뮤니티를 회귀시키지 않는다(REQ-2-006, REQ-3-004). 데모 안정성을 위해 기존 시드·동선이 빈 화면으로 시작하지 않아야 한다.

## 6. API / Server Action 명세

| 작업 | 기능 | 식별자(제안) | 메서드 | 경로/함수 | 권한 | 입/출력 요약 |
|---|---|---|---|---|---|---|
| 1 | 플랜 목록 조회 | `listMembershipPlansByCreator` | — | `src/lib/queries/memberships.ts` | 내부(서버) | `(creatorProfileId)` → `MembershipPlan[]`(최신순) |
| 1 | 플랜 수정 | — | PATCH | `/api/membership-plans/[id]` | 본인 크리에이터 | `{ title?, priceKrw?, description? }` → `MembershipPlan` |
| 1 | 플랜 삭제 | — | DELETE | `/api/membership-plans/[id]` | 본인 크리에이터 | → 성공 시 `{ ok: true }`, 활성 멤버 보유 시 **409** |
| 2 | 멤버십 AI 추천 | `suggestMembership` | — | `src/lib/ai/suggest.ts` | 내부(서버) | `{ description, ... }` → `{ suggestedPrice, benefits, reason, source }` |
| 2 | 멤버십 AI 추천 API | — | POST | `/api/membership-plans/ai-suggest` | 크리에이터 | `{ description, category?, targetAudience? }` → 추천 결과(Mock 폴백 포함) |
| 2 | 멤버십 생성(유지) | `createPlanAction` | POST | Server Action → `/api/membership-plans` | 크리에이터 | `{ title, priceKrw, description? }` → `MembershipPlan` (변경 없음) |
| 3 | 커뮤니티 탭 진입 | — | — | `/creators/[creatorId]?tab=community` | 공개 | 쿼리로 초기 탭 = 커뮤니티 |

> 검증 스키마: 작업 1은 `validation/membership.ts`에 `membershipPlanUpdateSchema`(기존 `membershipPlanCreateSchema`의 partial)를 추가한다. 작업 2는 멤버십 입력 스키마(가격·혜택 중심, 주차 구성 제외)를 `programs/ai-suggest`의 입력 스키마를 참고해 정의한다.

## 7. UI / 페이지

| 작업 | 경로 | 사용자 | 주요 컴포넌트 |
|---|---|---|---|
| 1 | `/dashboard/creator/memberships` (신규) | 크리에이터 본인 | 플랜 카드 목록(제목·가격·설명 + 수정/삭제 액션), "플랜 생성" 링크, 프로필 미보유 안내 |
| 1 | `/dashboard/creator/memberships/[id]/edit` (신규) | 크리에이터 본인 | 초기값 주입된 `MembershipPlanForm`(`programs/[id]/edit` 구조 참고) |
| 1 | `/dashboard/creator` (수정) | 크리에이터 본인 | 액션 그리드에 "멤버십 관리" 링크 추가 |
| 2 | `/dashboard/creator/memberships/new` (수정) | 크리에이터 본인 | `NewMembershipClient`(AI 추천 패널 + `MembershipPlanForm` 래핑, remount rev 주입). 제출은 기존 Server Action 유지 |
| 3 | `/creators/[creatorId]` (수정) | 공개 | `StudioTabs` — `?tab=community` 초기 탭 진입 지원 |
| 3 | `/dashboard/creator` (수정) | 크리에이터 본인 | "내 커뮤니티" → `/creators/{profileId}?tab=community` 링크 |
| 3 | `/dashboard/fan` (수정) | 팬 | 둘러보기 섹션 "커뮤니티" 진입(가입 스튜디오 커뮤니티 탭 또는 `/creators` 안내) |

## 8. 인수 기준 (Acceptance Criteria)

### 작업 1 — 멤버십 관리

- **AC-1-001**: Given 크리에이터 A가 멤버십 플랜 2개를 보유할 때, When `/dashboard/creator/memberships`에 접근하면, Then 두 플랜이 최신순 카드(제목·가격·설명)로 표시되고 "플랜 생성" 링크가 존재한다 (REQ-1-001).
- **AC-1-002**: Given 팬 또는 비로그인 사용자, When `/dashboard/creator/memberships`에 접근하면, Then 접근이 차단(리다이렉트)된다 (REQ-1-002).
- **AC-1-003**: Given `CreatorProfile`이 없는 로그인 크리에이터, When 관리 페이지에 접근하면, Then 플랜 목록 대신 안내 문구가 표시된다 (REQ-1-003).
- **AC-1-004**: Given 플랜 P를 보유한 크리에이터 A, When `/dashboard/creator/memberships/[P.id]/edit`에 진입하면, Then 폼에 P의 현재 `title`/`priceKrw`/`description`이 초기값으로 채워진다 (REQ-1-004).
- **AC-1-005**: Given 크리에이터 A의 플랜 P, When A가 `PATCH /api/membership-plans/[P.id]`에 `{ priceKrw: 9000 }`을 보내면, Then P의 가격이 9000으로 갱신되고 갱신 레코드가 반환된다 (REQ-1-005).
- **AC-1-006**: Given 비소유 크리에이터 B 또는 팬, When 플랜 P에 `PATCH`/`DELETE`를 호출하면, Then 비로그인 401 / 비크리에이터·타인 403이 반환된다 (REQ-1-006).
- **AC-1-007**: Given 활성 `Membership`이 1건 이상 연결된 플랜 P, When 소유 크리에이터가 `DELETE /api/membership-plans/[P.id]`를 호출하면, Then 409가 반환되고 P는 삭제되지 않으며 UI에 삭제 불가 안내가 표시된다 (REQ-1-007, 확정 결정 #1).
- **AC-1-008**: Given 활성 멤버가 없는 플랜 Q, When 소유 크리에이터가 `DELETE /api/membership-plans/[Q.id]`를 호출하면, Then Q가 실제 삭제되고 목록에서 사라진다 (REQ-1-008).
- **AC-1-009**: Given 크리에이터, When `/dashboard/creator`를 조회하면, Then 액션 그리드에 "멤버십 관리"(`/dashboard/creator/memberships`) 링크가 존재한다 (REQ-1-009).

### 작업 2 — AI 추천 정합

- **AC-2-001**: Given 크리에이터, When 멤버십 생성 화면에서 설명을 입력하고 "AI 추천 받기"를 실행하면, Then 추천 결과에 가격(`suggestedPrice`)과 혜택(`benefits`)이 포함되고(주차 구성 미포함), 반영 시 `priceKrw`/`description` 폼에 주입된다 (REQ-2-001, REQ-2-003).
- **AC-2-002**: Given 비로그인/팬/비크리에이터, When `POST /api/membership-plans/ai-suggest`를 호출하면, Then 각각 401/403이 반환되고, 잘못된 입력은 400이 반환된다 (REQ-2-002).
- **AC-2-003**: Given AI 모델 키 부재 또는 오류 상황, When 멤버십 AI 추천을 호출하면, Then Mock 폴백 결과(`source` 표기)가 200으로 반환되고 예외/내부 정보 노출이 없다 (REQ-2-005, NFR-002).
- **AC-2-004**: Given AI 추천으로 폼이 채워진 상태, When 크리에이터가 생성 폼을 제출하면, Then 기존 `createPlanAction`(→ `POST /api/membership-plans`)으로 플랜이 생성된다(제출 경로 불변) (REQ-2-004).
- **AC-2-005**: Given 기존 프로그램 생성 화면, When AI 추천을 사용하면, Then 프로그램 AI 추천(가격·혜택·주차 구성)이 기존대로 동작한다(회귀 없음) (REQ-2-006).

### 작업 3 — 커뮤니티 진입점

- **AC-3-001**: Given 크리에이터 프로필 ID가 C일 때, When `/creators/C?tab=community`로 접근하면, Then 커뮤니티 탭이 초기 활성 상태로 표시된다 (REQ-3-001).
- **AC-3-002**: Given 크리에이터, When `/dashboard/creator`를 조회하면, Then "내 커뮤니티" → `/creators/{profileId}?tab=community` 링크가 존재하고 클릭 시 커뮤니티 탭으로 이동한다 (REQ-3-002).
- **AC-3-003**: Given 팬, When `/dashboard/fan`을 조회하면, Then 둘러보기 섹션에 "커뮤니티" 진입(커뮤니티 탭 또는 `/creators` 안내)이 존재한다 (REQ-3-003).
- **AC-3-004**: Given 진입 동선 추가 후, When 기존 스튜디오 탭(소개/포스트/멤버십/클럽/커뮤니티)과 `/api/community-posts`를 사용하면, Then 모두 기존대로 동작한다(회귀 없음) (REQ-3-004).

### 품질 게이트

- **AC-G-001**: 각 작업 완료 시 `npm run typecheck`, `npm run lint`, `npm run test`(`vitest run`)가 통과한다. 본 SPEC 신규 테스트(멤버십 목록 쿼리, `PATCH`/`DELETE` 권한·삭제 차단, 멤버십 AI 추천 API, `NewMembershipClient` 폼 주입, 커뮤니티 탭 진입)가 포함된다 (NFR-005).
- **AC-G-002**: 작업 1 → 작업 2 → 작업 3 순서로 작업 단위 커밋(최소 3 커밋)이 이뤄진다 (NFR-006).

## 9. 의존성 및 선행 SPEC

- **선행 SPEC**:
  - **SPEC-003** (멤버십 플랜·가입) — `MembershipPlan`/`Membership` 모델, `MembershipPlanForm`, `membershipPlanCreateSchema`, `memberships/new` 생성 화면. 작업 1·2의 기반.
  - **SPEC-007** (커뮤니티 및 멤버 관리) — `CommunityPost`, `/api/community-posts`, `CommunityPanel/Composer/List`, `listCommunityPosts`, `StudioTabs`. 작업 3의 기반(읽기/변경 없이 진입만 추가).
  - **SPEC-010** (AI 가격·혜택·프로그램 구성 추천) — `lib/ai/suggest.ts`(`suggestProgram`), `/api/programs/ai-suggest`, `AiSuggestPanel`, `NewProgramClient`. 작업 2가 멤버십용으로 확장·재사용.
  - (간접) SPEC-002(스튜디오 페이지/탭 호스트), SPEC-004(프로그램 `[id]/edit`·`[id]/route.ts` 패턴 참고).
- **스키마 보완**: **없음**(§3 참조).
- **후행 SPEC**: 없음. 글로벌 커뮤니티 허브가 필요해지면 별도 SPEC(B안)으로 분리한다.

## 10. 제외 사항 (Exclusions / Won't)

- **글로벌 커뮤니티 허브 페이지 신설** — 확정 결정 #3에 따라 진입 링크만 보강. 유저플로우 문자 그대로의 단일 허브는 MVP 범위 초과로 별도 SPEC(B안) 권장.
- **멤버십 플랜 soft/hard delete 정책 변경** — 확정 결정 #1에 따라 활성 멤버 보유 시 차단(409)만. `deletedAt` 등 soft delete 컬럼 도입 안 함.
- **AI 추천 모델/프롬프트 교체·개선** — 작업 2는 기존 `suggest.ts` Mock 폴백 패턴을 멤버십용으로 분기할 뿐, 모델 교체·품질 튜닝은 범위 밖.
- **멤버십 생성 제출 흐름 변경** — 제출은 기존 Server Action(`createPlanAction`) 유지. 폼 주입만 클라이언트로 전환(REQ-2-004).
- **멤버십 가입/결제/취소/환불 로직 변경** — SPEC-003 범위. 본 SPEC은 플랜 관리·추천·진입 동선만 다룬다.
- **커뮤니티 데이터 모델·기능 변경(작성/잠금/모더레이션)** — SPEC-007 범위. 작업 3은 진입 동선(링크/초기 탭)만 추가한다.
- **6/21 이후 신규 기능 추가** — 데모 안정화·유저플로우 정합 보완으로 한정(기능 Freeze 준수).

## 11. 구현 노트 (Implementation Notes)

### AI 추천 함수 분기 방식

`suggestMembership` **신설** 방식 채택. `src/lib/ai/suggest.ts`에 `suggestProgram`(라인 224)과 독립적인 `suggestMembership`(라인 303) 함수를 추가했다. 멤버십은 주차 구성 없이 `suggestedPrice`·`benefits` 중심 결과를 반환하며 스키마가 달라 타입 확장보다 분기가 적합했다. Mock 폴백(`suggestMembershipMock`)도 별도 구현(라인 270)하여 외부 모델 오류 시 `source: "mock"` 표기와 함께 200을 반환한다.

### 삭제 차단 판정 위치

**API 라우트 레이어**(`src/app/api/membership-plans/[id]/route.ts`) 판정 채택. `DELETE` 핸들러에서 `prisma.membership.count({ where: { planId: id } })` 집계 후 1 이상이면 409를 반환한다(라인 85–86). 서비스 레이어 분리보다 단순하고 NFR-003(클라이언트 버튼 비활성만으로 불충분)을 서버에서 확실히 준수한다.

### MembershipPlanForm props 확장

`MembershipPlanFormInitial` 인터페이스(`{ title, priceKrw, description }`)를 새로 정의하고, `MembershipPlanFormProps`에 `initial?: MembershipPlanFormInitial` 선택적 prop을 추가했다. 각 필드는 `defaultValue={initial?.title ?? ""}` 패턴으로 초기값을 주입한다. 생성(`new`)·수정(`edit`) 양쪽에서 동일 컴포넌트를 재사용하며, 생성 시에는 `initial` 없이 호출한다.

### StudioTabs 초기 탭 진입 지원

기존 구현에는 초기 탭 제어가 없었다. **신규 추가** — `StudioTabs`에 `initialTab?: TabId` prop을 추가하고(라인 79), `useState<TabId>(initialTab ?? "intro")`(라인 93)로 초기값을 받는다. 상위 페이지(`/creators/[creatorId]/page.tsx`)에서 `searchParams.tab` 값을 읽어 `initialTab`으로 전달하는 방식으로 `?tab=community` URL 진입을 지원한다.

### 커밋 분리 결과

NFR-006 준수: 작업 단위별 3커밋 완료.

| 커밋 | 작업 | 해시 |
|------|------|------|
| 작업 1 | 멤버십 플랜 관리 화면·PATCH/DELETE API 신설 | `b29cd36` |
| 작업 2 | 멤버십 생성 화면에 AI 가격·혜택 추천 추가 | `7b5795a` |
| 작업 3 | 커뮤니티 진입 동선 보강 | `bf6bfa1` |

### 테스트 결과

신규 테스트 파일: `src/lib/queries/memberships.test.ts`(쿼리 vi.hoisted mock), `src/app/api/membership-plans/[id]/route.test.ts`(권한·삭제 차단), `src/app/api/membership-plans/ai-suggest/route.test.ts`(멤버십 AI 추천 API), `src/components/dashboard/NewMembershipClient.test.tsx`(폼 주입), `src/lib/ai/suggest.test.ts`(멤버십 suggest 분기 포함).

전체 테스트: **562 passed / 0 failed** (`npm run test -- --run` 기준, 2026-06-21).
