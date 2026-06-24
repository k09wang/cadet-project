# ArtBridge 피그마 컴포넌트 보강 계획서

작성일: 2026-06-22

- **대상 파일**: ArtBridge Design System (`fileKey: kRXui45SIlfWK80VhLJnt9`)
- **방향**: 코드/플로우 → 피그마 (디자인 신규 생성, `use_figma` write)
- **참고**: Wanted Design System (`CqPo2WCLn1rISdf45v5g4v`) — 카드/배지/테이블 스타일 패턴만 차용 (정산 전용 컴포넌트는 Wanted에 없음)
- **실행 주의**: `use_figma` 호출 전 반드시 `/figma-use` 스킬을 먼저 로드 (MANDATORY). 좌표는 `find_empty_space_on_canvas`로 확보.

---

## 1. 전체 플로우 vs 현재 피그마 컴포넌트 — 갭 전수

현재 피그마 도메인 컴포넌트(섹션 04~15)와 유저플로우 45노드를 매핑한 결과, 빠진 도메인 컴포넌트:

| 우선 | 플로우 노드 | 빠진 컴포넌트 | 비고 |
|:--:|---|---|---|
| **P1** | n21 결제/정산 현황 | **SettlementSummary**, **SettlementListItem**, **SettlementStatusBadge** | 정산 대시보드 부재 |
| **P1** | n22 완료 승인 | **CompletionApprovalDialog** | 정산 실행 전 확인 |
| P2 | n11·n12 포스트 작성·공개설정 | **PostComposer** (유료/공개/멤버십 한정 설정 포함) | 커뮤니티 Composer와 별개 |
| P2 | n31 프로그램 참여 신청 | **ApplicationForm** | 신청 제출 폼 |
| P2 | n32 내 신청 현황(팬) | **MyApplicationItem / ApplicationStatusTracker** | 팬 관점 상태 추적 |
| P3 | n25 스튜디오 공개 페이지 | **StudioProfileHeader** (공개 뷰) | 편집용 StudioHeaderEditor만 존재 |
| P3 | n23 탐색 홈(팬) | **ExploreHero / SectionHeader** | 홈 레이아웃 조립 보조 |

이미 있는 것(재사용): LoginModal, RoleSelectCard, SignupForm, CreatorCard, ProgramCard, MembershipPlanCard, LockedPostCard, Header, PaymentDialog, ContractPanel, AmountNegotiationPanel, PaymentResultCard, ApplicationReviewItem, ParticipantCard, Notification류, Community류, Review류, Studio Forms, Feedback/Empty/Confirm, 범용 컴포넌트(StatCard·DataTable·Timeline·Badge 등).

---

## 2. 신규 섹션 배치

피그마에 새 섹션 **`22 Components / Settlement & Payout`** 추가. 기존 도메인 섹션 컬럼(x=2840, 08~15가 세로로 쌓임)을 이어 15 섹션(y≈6580) 아래 y≈7440 부근 또는 빈 공간에 배치. 섹션 폭은 기존 도메인 섹션과 동일하게 **1280px**, 제목/설명 텍스트 패턴(Title 28px Bold `#1f1f1f`, Description 14px `#8e8e8e`) 동일하게.

---

## 3. 정산 컴포넌트 상세 스펙 (P1, 4종)

공통 토큰: 라운드 카드 `radius 8~16px`, 카드 패딩 16/20/24, border `#eee`, 금액 강조 `Text/Default #1f1f1f` Bold, 보조 텍스트 `#8e8e8e`. 정산 상태색 → **대기=Warning #FFAD0D / 정산가능=Program #2563EB / 완료=Success #47B881**.

### 3.1 SettlementSummary (정산 요약 카드)
- **구성**: 가로 3분할 StatCard 그룹 — `총 거래액` · `정산 대기` · `정산 완료`. 각 셀: 라벨(13px `#8e8e8e`) + 금액(24px Bold) + 보조(건수/증감).
- **치수**: 컨테이너 ~840×140, 셀 270×120 (기존 StatCard 199×143 패턴 차용).
- **변형**: `State=Default` / `State=Empty`(거래 없음).
- **참고**: ArtBridge `Stat Card`(10:474), Wanted 카드 spacing.

### 3.2 SettlementListItem (정산 내역 행)
- **구성**: 한 행 = 프로그램명/참여자(Avatar+이름) · 거래금액 · SettlementStatusBadge · 액션(완료승인 버튼 or "정산 완료" 텍스트). DataTable 헤더(프로그램·참여자·금액·상태·액션)와 세트로.
- **치수**: 행 높이 64~72px, 폭 1120px (기존 Map 행/ParticipantCard 560 패턴 확장).
- **변형**: `Status=Pending`(완료승인 버튼 노출) / `Status=Approvable`(정산 가능) / `Status=Settled`(완료, 액션 비활성).
- **참고**: ArtBridge `ParticipantCard/Paid Participant`(5:153), `DataTable`(10:445), `ListItem`(10:438).

### 3.3 SettlementStatusBadge (정산 상태 배지)
- **구성**: 기존 Badge 형태(rounded-full, 13px medium, `bg-X/10 text-X`) 확장. 도메인=Settlement, 상태 3종.
- **변형**: `State=Pending`(Warning #FFAD0D) / `State=Approvable`(Program #2563EB) / `State=Settled`(Success #47B881).
- **코드 매핑**: `src/components/ui/badge.tsx`에 이미 program/community/membership 도메인 변형이 추가됨(2026-06-22). 정산 상태는 success/warning/program 변형 재사용 또는 settlement 전용 변형 신설. 피그마 05 Badges 섹션에 도메인 행 추가하는 방식도 가능.
- **참고**: ArtBridge 05 `Badge/Domain Status`(2:64) 패턴 그대로.

### 3.4 CompletionApprovalDialog (완료 승인 모달)
- **구성**: ConfirmDialog 변형 — 제목("작업 완료를 승인할까요?"), 본문(참여자·금액·정산 안내), Footer(취소 ghost / 승인·정산 primary teal). 경고형 아님(긍정 액션)이라 destructive 색 대신 brand/success.
- **치수**: 패널 390~480 폭, modal radius 20px(피그마 Density 규칙), 패딩 24.
- **변형**: `State=Default` / `State=Loading`(승인 처리 중).
- **참고**: ArtBridge `ConfirmDialog/Destructive`(5:372)·`PaymentDialog`(5:61) 패턴, 색만 긍정형.

---

## 4. P2 컴포넌트 상세 스펙 (3종)

신규 섹션 후보: **`23 Components / Creator & Fan Flows`** (도메인 컬럼 x=2840 이어서 또는 빈 공간). 정산과 동일한 토큰 규칙 적용.

### 4.1 PostComposer (크리에이터 포스트 작성·공개설정) — n11·n12
- **구성**: 제목 Input + 본문 Textarea + 미디어 첨부(FileUpload) + 공개범위 SegmentedControl/Radio(전체 공개 / 멤버십 한정 / 유료) + (유료 선택 시) 가격 Input + (멤버십 한정 시) 플랜 SelectField + 하단 액션(임시저장 ghost / 게시 primary teal).
- **치수**: 패널 560~640 폭, 폼 세로 스택 gap 16/20, 패딩 24.
- **변형**: `Visibility=Public` / `Visibility=Membership`(플랜 필드 노출) / `Visibility=Paid`(가격 필드 노출).
- **참고**: ArtBridge `MembershipPlanForm`(5:345), `CommunityComposer`(5:226), `Textarea`(10:141), `FileUpload`(10:168), `SelectField`(10:136), `Tabs/Segmented`(10:32).
- **코드 매핑**: `src/components/posts/PostComposer.tsx`(신규), 화면 `/dashboard/creator/posts/new`.

### 4.2 ApplicationForm (프로그램 참여 신청) — n31
- **구성**: 상단 프로그램 요약 헤더(축약 ProgramCard) + 신청 메시지 Textarea + 포트폴리오/링크 첨부(FileUpload) + 약관 동의 Checkbox + 제출 버튼(primary).
- **치수**: 패널 520 폭, 패딩 24.
- **변형**: `State=Default` / `State=Submitting`(로딩) / `State=AlreadyApplied`(중복 신청 차단 안내).
- **참고**: ArtBridge `ReviewForm/Rating Tags`(5:266), `Textarea`, `Checkbox`(10:145), `ProgramCard`(2:81).
- **코드 매핑**: `src/components/programs/ApplicationForm.tsx`(신규), 화면 `/programs/[id]` 내 신청 모달 또는 섹션.

### 4.3 MyApplicationItem / ApplicationStatusTracker (팬 내 신청 현황) — n32
- **구성**: 프로그램 카드 축약(썸네일/제목/크리에이터) + 신청 상태 Stepper(신청 → 수락 → 계약 서명 → 결제 → 완료) + 현재 단계 강조 + 상태별 다음 액션 버튼("계약 서명하러 가기" / "결제하기" 등).
- **치수**: 카드 폭 560~720, 가로 카드 형태(좌 카드 요약 / 우 Stepper·액션).
- **변형**: `Status=Pending` / `Accepted` / `Contracted` / `Paid` / `Completed` / `Rejected`.
- **참고**: ArtBridge `Stepper/Progress`(10:54), `ProgramCard`(2:81), `Timeline`(10:479).
- **코드 매핑**: `src/components/applications/MyApplicationItem.tsx`(신규), 화면 `/dashboard/fan` 내 신청 현황(전용 라우트 신설 검토).

---

## 5. P3 컴포넌트 상세 스펙 (2종)

신규 섹션 후보: **`24 Components / Discovery & Studio Public`**. P2 섹션 이어서 배치.

### 5.1 StudioProfileHeader (스튜디오 공개 페이지 헤더, 팬 뷰) — n25
- **구성**: 커버 이미지 배너 + 원형 아바타 + 스튜디오명/한줄 소개 + 메타(팔로워·포스트 수, RatingSummary) + 우측 CTA(팔로우 outline / 멤버십 가입 primary teal).
- **치수**: 폭 1120, 커버 높이 200, 헤더 영역 하단 정보 행.
- **변형**: `State=Guest`(비로그인, 로그인 유도) / `State=Member`(가입됨, 멤버십 배지 표시) / `State=Default`.
- **참고**: ArtBridge `StudioHeaderEditor`(5:310, 편집용의 공개 뷰 대응), `Avatar`(10:424), `RatingSummary/Creator`(5:303), `MembershipPlanCard`(2:93).
- **코드 매핑**: `src/components/creators/StudioProfileHeader.tsx`(신규), 화면 `/creators/[creatorId]`.

### 5.2 ExploreHero / SectionHeader (탐색 홈, 팬) — n23
- **ExploreHero**: 히어로 배너 — 타이틀 + 서브카피 + 검색 SearchField + 주요 CTA + 배경. 폭 full(~1200), 높이 280.
- **SectionHeader**: 섹션 타이틀(예: "추천 크리에이터") + 더보기 링크 + 우측 필터/탭. 행 높이 48.
- **변형**: ExploreHero `Default`; SectionHeader `WithAction` / `Plain`.
- **참고**: ArtBridge `SearchField`(10:164), `Banner/Announcement`(10:313), `Tabs/Segmented`(10:32).
- **코드 매핑**: `src/components/home/ExploreHero.tsx`·`SectionHeader.tsx`(신규), 화면 `/dashboard/fan`(탐색 홈).

---

## 6. 실행 순서 (Sonnet용)

공통: `use_figma` 호출 전 매번 `/figma-use` 스킬 로드. 새 섹션은 `find_empty_space_on_canvas`로 좌표 확보. 각 단계 후 `get_screenshot`으로 시각 검증.

**P1 — 정산 (필수, 먼저)**
1. 섹션 `22 Settlement & Payout` 프레임 생성 (1280 폭, 제목/설명)
2. 정산 4종 생성: SettlementStatusBadge → SettlementListItem → SettlementSummary → CompletionApprovalDialog (배지→행→요약→모달, 의존도 낮은 것부터)
3. 03 Implementation Map에 정산 컴포넌트 행 추가 (코드 경로: `src/components/dashboard/` 또는 `src/components/contracts/` 신규 예정 경로 명시)

**P2 — 크리에이터·팬 플로우 (승인 후)**
4. 섹션 `23 Creator & Fan Flows` 생성
5. PostComposer → ApplicationForm → MyApplicationItem 생성 (3.x/4.x 변형 규칙대로)
6. Implementation Map에 P2 컴포넌트 행 추가

**P3 — 탐색·스튜디오 공개 (승인 후)**
7. 섹션 `24 Discovery & Studio Public` 생성
8. StudioProfileHeader → ExploreHero / SectionHeader 생성
9. Implementation Map에 P3 컴포넌트 행 추가

10. 전체 생성 후 섹션별 `get_screenshot` 일괄 검증, 토큰/도메인 색 정합 확인

---

## 7. 참고: 토큰 정합 현황 (2026-06-22 기준)

- 피그마 의미 토큰은 `src/app/globals.css`와 1:1 일치 (피그마가 코드 TapTap/Shadcn 토큰 기반으로 작성됨).
- 도메인 색 3개는 코드에 추가 완료: `--color-membership #7c3aed`, `--color-program #2563eb`, `--color-community #10b981` (globals.css) + badge.tsx 변형.
- 피그마 Program swatch는 칠이 `#15C5CE`로 잘못 칠해져 있음 — 라벨 기준 `#2563EB`(파랑)가 의도값. 피그마 파일 수정 권장.
