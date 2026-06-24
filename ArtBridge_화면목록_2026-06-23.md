# ArtBridge 화면 목록 (워크플로우 기반 추출)

> 작성일: 2026-06-23
> 근거: `ArtBridge 창작자-팬 후원 커뮤니티 MVP_유저플로우_2026-06-21.md.md` (45노드) + 코드 라우트(`src/app`) + 피그마 정본 `kRXui45SIlfWK80VhLJnt9`
> 목적: 피그마 `🖼 Screens` 페이지 화면 조합의 청사진. 각 화면을 정리된 컴포넌트(`🧩 Components` 페이지)로 조합한다.

## 요약

| 영역 | 독립 화면 | 모달/요소 |
|---|---|---|
| 🌐 공통 | 7 | — |
| 👀 팬 | 11 | — |
| 🎨 크리에이터 | 9 | — |
| 🔄 거래·공유 | 2 | 리뷰 모달 |
| 🆕 확장 (SPEC-011~015, 2026-06-24) | 10 | — |
| **합계** | **39 화면** | **1 모달** |

> **2026-06-24 갱신**: 현재 브랜치 `codex/전체흐름살펴봄`(SPEC-011~015) 코드와 정합화. 작품 주문·판매 커머스 도메인 신설, 결제는 모달이 아니라 **독립 checkout 페이지**로 확정. 상세는 아래 "🆕 확장 화면(30~39)" 절 참조.

## 공통 셸 (모든 화면 공유)

- **App Header** — Role=Guest/Fan/Creator (App Shell 페이지)
- **Page Header** — 내부 페이지 제목/설명
- **Footer** — 약관·개인정보·지원 링크 포함

---

## 🌐 공통 영역 (7)

| # | 화면 | 유저플로우 | 라우트 | 주요 구성 컴포넌트 |
|---|---|---|---|---|
| 1 | 랜딩·탐색 홈 | n23 | `/` | App Header(Guest) · ExploreHero · SectionHeader×4 · CreatorCard · ProgramCard · Footer |
| 2 | 로그인 | n2 | `/login` | 로그인 폼(InputField · Button) · LoginModal 패턴 |
| 3 | 회원가입 + 역할 선택 | n3·n4 | `/signup` | SignupForm · RoleSelectCard(Fan/Creator) |
| 4 | 이용약관 | — | `/terms` | 본문 텍스트 · Footer |
| 5 | 개인정보처리방침 | — | `/privacy` | 본문 텍스트 · Footer |
| 6 | 고객지원/FAQ | — | `/support` | Accordion(FAQ) · Footer |
| 7 | 404·에러 | — | (보강) | ErrorState · EmptyState |

---

## 👀 팬 영역 (11)

### 탐색·신청 (s4)

| # | 화면 | 유저플로우 | 라우트 | 주요 구성 컴포넌트 |
|---|---|---|---|---|
| 8 | 크리에이터 목록 | n24 | `/creators` | Page Header · CreatorCard 그리드 · 필터(Chip) · Pagination |
| 9 | 스튜디오 공개 페이지 | n25·n26 | `/creators/[id]` | StudioProfileHeader · Tabs(소개/포스트/멤버십/클럽/커뮤니티) · PostCard · MembershipPlanCard · ProgramCard · CommunityPostItem · RatingSummary |
| 10 | 포스트 상세 | n27·n28 | `/posts/[id]` | PostDetail · LockedPostCard · PostPurchasePrompt · (결제 모달) |
| 11 | 프로그램 목록 | n29 | `/programs` | Page Header · 필터 · ProgramCard 그리드 · Pagination |
| 12 | 프로그램 상세 | n30·n31 | `/programs/[id]` | ProgramDetail · ApplicationForm · ReviewItem · RatingSummary |

### 팬 마이페이지 (대부분 유저플로우 갭, 헤더·코드 실재)

| # | 화면 | 유저플로우 | 라우트 | 주요 구성 컴포넌트 |
|---|---|---|---|---|
| 13 | 팬 홈/대시보드 | — | `/dashboard/fan` | App Header(Fan) · Quick Action Tile · 추천 섹션(CreatorCard/ProgramCard) |
| 14 | 내 신청 현황 | n32 | `/dashboard/fan/applications` | Page Header · MyApplicationItem 목록(상태별) |
| 15 | 관심 작가 | 갭 | `/dashboard/fan/bookmarks` | CreatorCard 그리드 · EmptyState |
| 16 | 내 멤버십 | 갭 | `/dashboard/fan/memberships` | MembershipPlanCard 목록 · EmptyState |
| 17 | 내 신청·결제 | 갭 | `/dashboard/fan/payments` | PaymentResultCard · Stat Card · 목록 |
| 18 | 프로필/설정 | 갭 | `/dashboard/fan/profile` | 폼(InputField) · Avatar |

---

## 🎨 크리에이터 영역 (9, 탭 통합 적용)

### 스튜디오 운영 (s2)

| # | 화면 | 유저플로우 | 라우트 | 주요 구성 컴포넌트 |
|---|---|---|---|---|
| 19 | 크리에이터 대시보드 | n5 | `/dashboard/creator` | App Header(Creator) · Studio Summary Card · Quick Action Tile 그리드 |
| 20 | 스튜디오 편집 | n6·n7 | `/dashboard/creator/edit` | StudioHeaderEditor · 폼(InputField/Textarea) |
| 21 | 멤버십 (플랜·멤버 탭) | n8 | `/dashboard/creator/memberships` (+`members`) | Tabs · MembershipPlanCard · 멤버 목록(ListItem/Avatar) |
| 22 | 멤버십 생성/수정 폼 | n9·n10 | `…/memberships/new`·`[id]/edit` | MembershipPlanForm · AiSuggestPanel |
| 23 | 포스트 작성 | n11·n12 | `/dashboard/creator/posts/new` | PostComposer (Visibility 탭) |

### 프로그램 운영 (s3)

| # | 화면 | 유저플로우 | 라우트 | 주요 구성 컴포넌트 |
|---|---|---|---|---|
| 24 | 프로그램 관리 | n13 | `/dashboard/creator/programs` | ProgramCard 목록 · Button · EmptyState |
| 25 | 프로그램 생성/수정 폼 | n14·n15 | `…/programs/new`·`[id]/edit` | ProgramForm · AiSuggestPanel |
| 26 | 프로그램 운영 (개요·신청자·참여자 탭) | n16·n17·n18 | `…/programs/[id]` (+`applications`,`participants`) | Tabs · ProgramDetail · ApplicationReviewItem · ParticipantCard |
| 27 | 정산 현황 (완료 승인) | n21·n22 | `/dashboard/creator/settlements` | SettlementSummary · SettlementListItem · SettlementStatusBadge · CompletionApprovalDialog |

---

## 🔄 거래·공유 영역 (2 화면 + 2 모달)

### 독립 화면

| # | 화면 | 유저플로우 | 라우트 | 주요 구성 컴포넌트 |
|---|---|---|---|---|
| 28 | 알림 센터 | n33·n34·n35 | `/notifications` | NotificationPopover/목록 · Toast · EmptyState |
| 29 | 계약서/약관 동의 (확장) | n19·n20·n36·n37 | `/contracts/[id]` | ContractDetail · AmountNegotiationPanel(금액 조율) · 양측 전자서명 · PG 결제 · 납품요청·완료승인(에스크로) · OpenContractButton |

> **29 확장 (SPEC-011·012·013)**: 단순 약관 동의 → 금액 합의/거절 + 양측 서명 + PG Sandbox 결제 + 에스크로(납품 요청·완료 승인)로 대폭 확장. 양방향 평가 연동.

### 모달·요소 (별도 화면 아님)

| 요소 | 유저플로우 | 형태 | 컴포넌트 |
|---|---|---|---|
| ~~Mock 결제~~ | n38·n39 | **독립 페이지로 승격** → 화면 34·35·36 (checkout) 참조 | — |
| 리뷰 작성 | n43·n44 | 모달/폼 (양방향, SPEC-013) | ReviewForm |
| 커뮤니티 (글목록·작성) | n40·n41·n42 | 스튜디오 탭 (화면 9 내) | CommunityPostItem · CommunityComposer · CommunityLockedNotice |
| 평점/리뷰 목록 | n45 | 섹션 (화면 9·12 내) | ReviewItem · RatingSummary |

---

## 🆕 확장 화면 (30~39, SPEC-011~015 코드 정합, 2026-06-24)

현재 브랜치 `codex/전체흐름살펴봄` 코드 기준 신규 라우트. 작품 커머스 + 결제 페이지화 + 정산 + 멤버 관리 분리.

### 작품 주문·판매 커머스 (신규 도메인, SPEC-015)

작품 주문 상태머신: `결제대기 → 결제완료 → 배송준비 → 배송중 → 배송완료 → 수령완료` (+ 취소·환불·문제접수)

| # | 화면 | 라우트 | 영역 | 주요 구성 컴포넌트 |
|---|---|---|---|---|
| 30 | 크리에이터 작품 관리 | `/dashboard/creator/artworks` | 크리에이터 | ArtworkForm · CreatorWorkForm · ArtworkManagerCard · CreatorWorkManagerCard · ImageUploadField |
| 31 | 크리에이터 작품 주문 관리(배송) | `/dashboard/creator/artwork-orders` | 크리에이터 | 주문 목록(상태 배지) · ShipmentForm · CreatorArtworkOrderActions |
| 32 | 팬 작품 주문 목록 | `/dashboard/fan/artwork-orders` | 팬 | 주문 카드(상태 8종) · ArtworkIssueReporter |
| 33 | 작품 주문 상세 | `/artwork-orders/[id]` | 거래 | 주문 상세 Card · ReceiveArtworkButton(수령확인) · ArtworkIssueReporter(이슈신고) |

### 결제 체크아웃·영수증 (모달 → 독립 페이지)

| # | 화면 | 라우트 | 영역 | 주요 구성 컴포넌트 |
|---|---|---|---|---|
| 34 | 작품 구매 결제 | `/artworks/[id]/checkout` | 거래 | 주문 요약 Card · 배송지 · 결제 버튼 |
| 35 | 프로그램 신청 결제 | `/programs/[id]/checkout` | 거래 | 프로그램 요약 · ProgramFaqSection · 결제 버튼 |
| 36 | 멤버십 가입 결제 | `/creators/[creatorId]/memberships/[planId]/checkout` | 거래 | 플랜 요약 · 혜택 목록 · 결제 버튼 |
| 37 | 결제 영수증 | `/dashboard/fan/payments/[id]/receipt` | 팬 | 영수증 Card(멤버십·포스트·프로그램·작품 통합 표기) |

### 정산·멤버 운영

| # | 화면 | 라우트 | 영역 | 주요 구성 컴포넌트 |
|---|---|---|---|---|
| 38 | 정산 지급 설정 | `/dashboard/creator/payout-settings` | 크리에이터 | 계좌·사업자 폼(개인/개인사업자/법인) · 검증상태 배지 |
| 39 | 멤버 관리 (멤버십 탭에서 분리) | `/dashboard/creator/members` | 크리에이터 | MemberList(활성 멤버 목록) |

> **13 팬 홈 placeholder 해소**: 이전 "작품 주문 컴포넌트 코드 미공유"로 점선 placeholder였던 자리 → 작품 주문 컴포넌트(ArtworkOrder 계열)가 코드에 실재하므로 실제 주문 목록으로 교체 가능.

> **제외(화면 아님)**: `/design-system`, `/wireframes`(개발용).

---

## 조합 순서 (확정)

공통(랜딩부터) → 팬 → 크리에이터 → 거래·공유

각 화면은 피그마 `🧩 Components` 페이지의 마스터를 인스턴스로 가져와 App Shell(Header/Footer) 위에 조립한다. 데스크톱 1440 기준.

---

## 코드 구현 필요 (디자인 선반영, 2026-06-23)

(B) 워크플로우상 디자인에 먼저 넣었으나 코드에는 없는/불일치하는 항목. 추후 코드 구현 시 반영.

### 1번 랜딩 (`/`)
디자인을 카드 포맷별로 다양화함(레퍼런스: 피그마 `Main-Web Desktop(xl)`). 코드 `page.tsx`는 현재 전 섹션이 CreatorCard/ProgramCard 단일 세로 카드라, 아래 신규 포맷 컴포넌트 구현이 필요.

신규 카드 포맷 컴포넌트(피그마 `🧩 Components`에 마스터 생성, 토큰 바인딩 완료):
- [ ] **FeatureBannerCard** (`Spotlight`) — 이미지/그라데이션 풀블리드 + 하단 스크림 + 오버레이 텍스트(배지·제목·서브). 섹션 1(추천 크리에이터) 3개 사용
- [ ] **CompactThumbCard** — 썸네일 상단 + 카테고리/제목/메타. 섹션 2(인기 작가) 4열 사용
- [ ] **ListRowCard** (`Program`) — 가로 row(썸네일·제목/메타·우측 가격/상태태그). 섹션 3(진행 중인 프로그램) 2열×3행 사용

섹션 구성(디자인 기준):
- [ ] 섹션 1 추천 크리에이터 → FeatureBannerCard ×3 (배너 형식)
- [ ] 섹션 2 인기 작가 → CompactThumbCard ×4
- [ ] 섹션 3 진행 중인 프로그램 → ListRowCard 2열×3행
- [x] 섹션 4 새 프로그램 → ProgramCard (기존)
- [ ] 섹션 5 멤버에게 인기 있는 포스트 → LockedPostCard 그리드 (멤버 전용/잠금 포스트 추천 쿼리·섹션 필요)
- [ ] 섹션 6 인기 멤버십 플랜 → MembershipPlanCard 그리드 (인기 멤버십 집계 쿼리·섹션 필요)

### 2번 로그인 (`/login`, LoginModal)
- [ ] **비밀번호 찾기** — 디자인에 링크 추가됨. 코드·라우트 없음 (예: `/forgot-password`)
- [ ] **이메일(아이디) 찾기** — 디자인에 링크 추가됨. 코드 없음 (이메일 로그인이라 우선순위 낮음)
- [ ] **구글 로그인** — 디자인엔 상시 노출. 코드는 `process.env.GOOGLE_CLIENT_ID` 있을 때만 조건부 렌더 → 정합 확인 필요
- [x] 회원가입 링크 — 코드에 이미 있음 (`/signup`)
- [x] 데모 계정 버튼(크리에이터/팬) — 코드에 이미 있음 (`loginAsDemo`)
