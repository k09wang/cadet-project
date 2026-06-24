# ArtBridge 피그마 하이파이 화면 조립 — 작업 현황 핸드오프

> 작성일: 2026-06-24
> 목적: 다른 세션/계정에서 동일 작업을 이어가기 위한 자립 문서.
> 청사진(화면 목록): `ArtBridge_화면목록_2026-06-23.md`

---

## 0. 핵심 원칙 (반드시 준수)

- **하드코딩 금지 — 모든 화면은 컴포넌트 인스턴스로 조립.** raw 프레임/텍스트 직접 생성 금지.
  - 예외(허용): 화면 레이아웃 구조용 **섹션 래퍼 프레임 · 섹션 제목 텍스트 · 의도적 placeholder**. (사용자 확인됨)
- 새 컴포넌트 생성 전 **기존 유사 컴포넌트 존재 여부 먼저 조사**(중복 방지).
- 레퍼런스(윈티드·네이버카페 등)는 **구조/레이아웃만 차용**, ArtBridge 토큰·색은 그대로 유지.
- 카드 포맷은 글자만 바꾸지 말고 레이아웃 자체를 다양화.
- 모든 사용자 응답은 한국어.

---

## 1. 피그마 파일 / 페이지

- **정본 파일**: fileKey `kRXui45SIlfWK80VhLJnt9` ("ArtBridge Design System"). 코드 토큰과 정렬된 정본.
  - (참고 파일 `L4stxscsEaeTuwwoHhYngo` "Guide v2"는 primitive 설계 참고서로만, 토큰 체계 다름 — 사용 안 함.)
- **페이지**:
  - `📚 System Docs` (1:2) — 문서·갤러리 + C1/C2 직접조립 잔존
  - `🧱 App Shell` (80:792) — App Header / Page Header / Studio Summary Card / Quick Action Tile 등 셸 컴포넌트
  - `🖼 Screens` (80:793) — 하이파이 화면 조립 영역 (데스크톱 1440)
  - `🧩 Components` (121:800) — 마스터 컴포넌트 121+개, 13 카테고리 정렬
  - `icon` (105:1323) — 아이콘 세트

---

## 2. 토큰 시스템

- 변수 컬렉션 **`ArtBridge Tokens`** (`VariableCollectionId:1:12`, modeId `1:0`, Light). 16색 + radius + spacing.
- 색: brand-primary `#15c5ce`/-hover `#47cfd6`/-pressed `#00abb6`, brand-subtle `#eefcfc`, surface-default/-subtle `#fafafa`, text-default `#1f1f1f`/-muted `#8e8e8e`/-subtle `#4b4b4b`, border-default `#eeeeee`.
- radius: control 10 / card 12 / panel 16 / modal 20.
- 도메인색: membership `#7c3aed` / program `#2563eb`(라벨 파랑이 의도값) / community `#10b981`.
- 도메인 wash(연틴트): membership-wash `#f5f3ff`(164:892) / community-wash `#ecfdf5`(164:893) / brand primary-wash `#f2fefd`(14:329).
- **폰트**: 원격 use_figma 환경엔 Pretendard 미설치 → **Noto Sans KR** 사용(코드 globals.css fallback과 정합). Inter Regular→Regular / Medium→Medium / Semi Bold→Bold / Bold→Bold.
- 모든 컴포넌트는 색/폰트 토큰 바인딩 일괄 정리 완료(2026-06-23).
- **UI 고급화 P1~P4(2026-06-24)**: 그림자·쿨그레이 배경·미디어 아이콘·아바타 그라데이션·아코디언 chevron·통계패널 정리. 상세는 `ArtBridge_UI_고급화_계획.md`.
- **전수 QA 정리(2026-06-24)**: 반복 더미 다양화(16/17/21/24/30/31/32/06 등)·맥락 텍스트 교정(18 프로필·24/33 버튼·21/28/39 리스트)·EmptyState 오배치 제거(15/16/28/39)·**Fan 헤더 nav "관심작가" 3중복 버그 수정**(마스터 83:792, 관심 작가/내 멤버십/내 신청·결제로). 함정: 인스턴스 substring 매칭이 헤더 등 의도외 노드를 잡을 수 있음 → 인스턴스 범위 내 검색.
- **Effect Style 3종(2026-06-24 UI 고급화)**: `elevation/card`=`S:90dfa38ca9208e88fb40b0052764027d8244283d,` / `elevation/raised`=`S:d3d916a10ab6d249ed023ad53879564ae882393d,` / `elevation/overlay`=`S:0645a855de44bdb299efd17e0d21261c5cb5e4fa,`. 카드 마스터에 `node.setEffectStyleIdAsync(id)`로 적용.
- **셸 배경**: 화면 Main 배경 = 쿨그레이 `#F7F8FA`(rgb 0.969,0.973,0.980). 셸 Content itemSpacing 32, paddingTop 56.

---

## 3. 주요 컴포넌트 ID 카탈로그

### 셸 (App Shell 페이지)
| 컴포넌트 | ID |
|---|---|
| App Header set | 84:813 → Role=Creator(82:792) / Fan(83:792) / Guest(84:792) · 메뉴 좌측 고정 구조(MIN 정렬 + Spacer After Menu grow=1). Fan 메뉴 프레임 `277:13130`에 Menu Item 복제로 항목 추가 |
| Page Header | 86:792 (eyebrow/title/desc) |
| Studio Summary Card | 94:792 (1100w, 크리에이터 프로필) |
| Quick Action Tile set | 92:844 → Brand(91:792)/Program(92:792)/Membership(92:805)/Success(92:817)/Community(92:830), 자연폭 540 |

### 카드 / 디스커버리 (Components 페이지)
| 컴포넌트 | ID |
|---|---|
| CreatorCard / Studio | 2:69 (280w) |
| ProgramCard / Recruiting | 2:81 (280w) |
| SectionHeader | WithAction(30:728, 타이틀+칩+더보기) / Plain(30:742, 타이틀만) |
| FeatureBannerCard/Spotlight | 157:918 |
| CompactThumbCard/Default | 157:926 |
| ListRowCard/Program | 157:932 |
| LockedPostCard | 2:105 (Media 2:106) |
| MembershipPlanCard | 2:93 (Media 2:94) |
| FanProfileCard ⭐신규(2026-06-24) | 237:1262 (1100w, 팬 프로필 — Studio Summary Card 변형) |

### 🆕 작품 커머스 (Components 페이지, 2026-06-24 생성 — 카테고리 "Domain · Artwork Commerce" y≈20100)
| 컴포넌트 | ID |
|---|---|
| ArtworkProductCard set | 245:1287 → Status=Published(245:1263)/Sold/Draft. 286w, 썸네일+상태배지+제목+가격·재고+주문수. 화면 30 그리드용 |
| ArtworkOrderCard set | 246:1312 → Status=Paid(245:1288)/PendingPayment/Preparing/Shipped/Received/IssueOpened. 720w row, 썸네일+작품명+스튜디오/수령자+배송정보+상태배지+금액. 화면 31·32 목록용 |
| ArtworkForm / Create | 247:1262 (480w, 작품명·설명·이미지업로드(점선)·가격/재고/상태 3col·등록버튼). 화면 30 |
| ShipmentForm / Default | 248:1262 (480w row, 택배사·송장번호·발송처리). 화면 31 |
| CheckoutSummaryCard / Default | 249:1262 (380w, 상품 요약+상품금액/배송비/총액 라인+결제하기). 화면 34·35·36 공용 |
| ReceiptCard / Default | 252:1262 (560w, 종류/제목/판매자+구매자·결제일·상태·공급가·수수료 dl+총결제금액(brand)+안내박스). 화면 37 |
| PayoutStatusCard / Pending | 253:1262 (440w, 현재 상태+검증배지(대기 warning)+유형/은행·예금주/계좌). 화면 38 좌측 |
| PayoutSettingsForm / Default | 253:1278 (520w, 지급유형 select·은행명/예금주 2col·계좌번호+helper·사업자등록번호·저장버튼). 화면 38 우측 |

> 토큰 바인딩 완료(ArtBridge Tokens, Noto Sans KR). 그라데이션 썸네일 stop색만 장식(미바인딩). ImageIssueReporter/ReceiveArtworkButton 등 버튼류는 기존 ui/button 인스턴스로 화면에서 조립.

### 포스트 / 커뮤니티
| 컴포넌트 | ID |
|---|---|
| PostDetail | Free(53:724)/Members(53:739)/Paid(53:760) |
| PostArticle/Detail (카페형 풀아티클) | 203:924 (720w) |
| CommentSortBar / CommentInput / CommentRow / CommentReply | 213:924 / 213:925 / 213:926 / 213:927 |
| RelatedPostItem | 213:928 |
| Divider Line (순수 1px 선) | 213:929 |
| Breadcrumb | 10:26 |
| FilterChip set | 223:1213 → Selected=True(223:1211, brand채움)/False(223:1209, surface+border) |

### 프로그램 / 신청 / 리뷰
| 컴포넌트 | ID |
|---|---|
| ProgramDetail | Recruiting(54:721)/Closed(54:736), 560w |
| ApplicationForm | Default(26:720)/Submitting(26:738)/AlreadyApplied(26:756), 520w |
| MyApplicationItem (라이프사이클 559w) | Pending(27:720)/Accepted(27:750)/Contracted(27:782)/Paid(27:814)/Completed(27:844)/Rejected(27:876) |
| ApplicationReviewItem | Pending(5:123)/Accepted(5:137)/Rejected(5:145) |
| ReviewItem / Bidirectional | 5:293 (580w) |
| RatingSummary / Creator | 5:303 (580w) |
| ReviewForm / Rating Tags | 5:266 |

### 계약 / 결제 / 정산
| 컴포넌트 | ID |
|---|---|
| ContractPanel / Dual Signature | 5:79 |
| AmountNegotiationPanel | 5:98 |
| PaymentDialog / Mock Checkout | 5:61 |
| PaymentResultCard / Paid Released | 5:112 |
| SettlementStatusBadge | Pending(21:723)/Approvable(21:725)/Settled(21:727) |
| SettlementSummary | Default(21:729)/Empty(21:744) |
| SettlementListHeader / SettlementListItem | 22:720 / Pending(22:731)·Approvable(22:745)·Settled(22:759) |
| CompletionApprovalDialog | Default(22:772)/Loading(22:783) |

### 프로필 / 상태 / 범용
| 컴포넌트 | ID |
|---|---|
| StudioProfileHeader | Default(29:720)/Guest(29:737)/Member(29:752), 1200w |
| Badge / Domain Status set | 2:64 (Role/Application/Contract/Payment/Access/Membership) |
| Stat Card | 10:474 |
| EmptyState | 5:383 |
| ErrorState / Retry | 5:395 |
| Footer | 인스턴스 130:899 → getMainComponentAsync로 마스터 획득해 createInstance |

---

## 4. 완료 화면 (🖼 Screens 페이지, x좌표 순)

| # | 화면 | node id | x | 비고 |
|---|---|---|---|---|
| 01 | 랜딩·탐색 홈 | 130:886 | 0 | 카드 포맷 3종 다양화 |
| 02 | 로그인 | 136:1107 | 1540 | |
| 03① | 회원가입 역할 선택 | 169:3000 | 3080 | Fan/Creator 역할카드 |
| 03② | 정보 입력 (팬) | 177:3029 | 4620 | SignupForm(윈티드 구조) |
| 03② | 정보 입력 (크리에이터) | 178:3029 | 6160 | |
| 08 | 크리에이터 목록 | 180:3048 | 7700 | Guest헤더·3열·FilterChip |
| 09 | 스튜디오 공개 | 185:3206 | 9240 | StudioProfileHeader·탭바·PostDetail |
| 10 | 포스트 상세 | 196:3373 | 10780 | PostArticle 카페형 |
| 10 | 포스트 상세·결제 모달 | 198:3529 | 12320 | 스크림+PaymentDialog |
| 11 | 프로그램 목록 | 224:4292 | 13860 | ProgramCard 3열·FilterChip |
| 12 | 프로그램 상세 | 229:4712 | 15360 | 단일 760컬럼: Breadcrumb·ProgramDetail·리뷰 |
| 12 | 프로그램 상세·신청 모달 | 230:4703 | 16860 | 스크림+ApplicationForm (신청하기 클릭 시) |
| 13 | 팬 홈·대시보드 | 233:4922 | 18360 | 내 정보·계약진행·작품주문(placeholder)·결제내역 |
| 14 | 내 신청 현황 | 241:4932 | 19860 | 상태 필터칩 7종 + MyApplicationItem 6상태 목록 |
| 15 | 관심 작가 | 256:5197 | 27360 | CreatorCard 3×2 그리드 + EmptyState (GLM PREAMBLE 검증용으로 직접 생성) |

**병렬 생성 패키지**: `ArtBridge_GLM_화면생성_프롬프트.md` — 04~07·16~39 화면별 코드 블록 + 공통 PREAMBLE 헬퍼(buildShell/cardGrid/listCol/twoCol/tabBar/infoCard) + x좌표 배정표 + 전체 컴포넌트 ID 부록. 화면 15로 헬퍼 실증 완료. GLM 5.2에 1세션 1화면씩 투입.

**다음 빈 x 위치**: x좌표는 위 프롬프트 문서 배정표 기준(16=28860 …). 신규 화면은 1440 폭 + 60 갭.

---

## 5. 화면별 핵심 구성 메모

- **셸 패턴(공통)**: `[App Header instance(FILL) · Main(VERTICAL, center, content 1200/760 FIXED) · Footer instance(FILL)]`. Main bg는 흰색 또는 연회색({0.98,0.985,0.99}).
- **09 탭바**: Tabs/Segmented(10:32)는 3세그먼트라 5탭엔 부적합 → 탭바 직접 생성(strokeBottomWeight baseline 1 + 활성탭 2px brand 언더라인). 향후 탭 화면(21·26) 재사용.
- **10 포스트 상세**: 9에서 1차 필터 후 클릭 → 전체 공개 풀아티클(PostArticle/Detail). 댓글·관련포스트는 컴포넌트화(CommentSortBar/Input/Row/Reply, RelatedPostItem).
- **12 프로그램 상세**: 신청 폼은 상시노출 아님 → **신청하기 버튼 클릭 시 뜨는 별도 모달 프레임**(10번 결제모달과 동일 패턴). 상세는 단일컬럼.
- **13 팬 홈**: ⚠️사용자 명시 — 추천 위주 아니라 **내 정보·계약 진행·최근 작품 주문·최근 결제 내역** 구성. 계약/결제는 MyApplicationItem 라이프사이클 목록형(Contracted=계약, Paid/Completed=결제). **작품 주문 컴포넌트는 코드 쪽(`src/components/artworks/`) 작업 중이라 피그마 미공유 → 점선 placeholder로 보류, 공유되면 교체.**

---

## 6. use_figma 조립 패턴 / 함정 (재사용)

- **figma-use 스킬 선로딩 필수**. `skillNames:"figma-use"` 파라미터.
- 페이지 전환 `await figma.setCurrentPageAsync(page)` (sync setter 금지). 호출당 1회.
- **인스턴스화 헬퍼**: 노드가 COMPONENT면 `createInstance()`, INSTANCE면 `getMainComponentAsync().createInstance()`.
- **폰트 로드 필수**: 인스턴스 appendChild/텍스트 변경 전, 서브트리 텍스트의 fontName 수집 후 `loadFontAsync`. (`getStyledTextSegments(['fontName'])`로 수집, mixed 대비.)
- **layoutSizing FILL/HUG는 auto-layout 부모에 append 후** 설정. (append 전 에러)
- **고정폭 카드를 넓은 컬럼에 FILL로 쓸 때**: 내부 요소도 FILL이어야 정렬됨(좌측 치우침 버그). 예) PostDetail body/image/divider, ProgramDetail 커버 Rectangle(54:722)·설명(54:733), RatingSummary Meta(5:306), ReviewItem Head(5:294)/Comment(5:297) → FIXED→FILL 보정 완료.
- **자연폭 유지 권장**: ApplicationForm(520, 내부필드 472 FIXED) 등은 FILL 안 하고 자연폭 유지가 안전.
- **텍스트 오버라이드**: `inst.findAll(t=>t.type==='TEXT')` + 기본문자열 매핑 dict, 또는 시각순 정렬(orderTexts: y→x) 후 배열 매핑.
- **우측 정렬**: itemSpacing 하드코딩 말고 FILL + primaryAxisAlignItems='SPACE_BETWEEN'.
- 토큰 없는 색(구분자 등)은 bind 말고 plain SOLID fill `[{type:"SOLID",color:rgb}]`.
- 스크린샷: get_screenshot → URL을 curl로 다운로드 → Read로 확인.
- 새 컴포넌트는 `createComponentFromNode(node)` 또는 기존 마스터 `clone()` 후 Components 페이지로 appendChild(빈 공간 y 계산).

---

## 7. 다음 작업 (남은 화면)

청사진 `ArtBridge_화면목록_2026-06-23.md` 기준. 조합 순서: 공통→팬→크리에이터→거래.

**팬 영역 (진행 중)**
- [x] 14 내 신청 현황 (`/dashboard/fan/applications`) — 상태 필터칩 7종 + MyApplicationItem 6상태 목록 (760 단일컬럼, 셸=헤더/Footer 클론). node 241:4932
- [ ] 15 관심 작가 (`/dashboard/fan/bookmarks`) — CreatorCard 그리드 + EmptyState
- [ ] 16 내 멤버십 (`/dashboard/fan/memberships`) — MembershipPlanCard 목록 + EmptyState
- [ ] 17 내 신청·결제 (`/dashboard/fan/payments`) — PaymentResultCard · Stat Card
- [ ] 18 프로필/설정 (`/dashboard/fan/profile`) — 폼(InputField) · Avatar

**공통 (미완)**
- [ ] 04 이용약관 / 05 개인정보 / 06 FAQ(Accordion) / 07 404·에러(ErrorState/EmptyState)

**크리에이터 영역 (19~27)**
- [ ] 19 크리에이터 대시보드 / 20 스튜디오 편집 / 21 멤버십(탭) / 22 멤버십 폼 / 23 포스트 작성
- [ ] 24 프로그램 관리 / 25 프로그램 폼 / 26 프로그램 운영(탭) / 27 정산 현황

**거래·공유 (28~29)**
- [ ] 28 알림 센터 / 29 계약서·약관 동의(확장: 금액조율·양측서명·PG결제·에스크로, SPEC-011·012·013)

**🆕 확장 화면 (30~39, SPEC-011~015 코드 정합, 2026-06-24 추가)** — 청사진 "🆕 확장 화면" 절 참조
작품 커머스:
- [ ] 30 크리에이터 작품 관리 (`/dashboard/creator/artworks`) — ArtworkForm·CreatorWorkForm·ArtworkManagerCard·ImageUploadField (신규 컴포넌트 필요)
- [ ] 31 크리에이터 작품 주문 관리 (`/dashboard/creator/artwork-orders`) — 주문목록·ShipmentForm·CreatorArtworkOrderActions
- [ ] 32 팬 작품 주문 목록 (`/dashboard/fan/artwork-orders`) — 주문카드(상태 8종)·ArtworkIssueReporter
- [ ] 33 작품 주문 상세 (`/artwork-orders/[id]`) — 주문상세·ReceiveArtworkButton·ArtworkIssueReporter
결제·영수증(독립 페이지):
- [ ] 34 작품 구매 결제 (`/artworks/[id]/checkout`)
- [ ] 35 프로그램 신청 결제 (`/programs/[id]/checkout`) — ProgramFaqSection
- [ ] 36 멤버십 가입 결제 (`/creators/[creatorId]/memberships/[planId]/checkout`)
- [ ] 37 결제 영수증 (`/dashboard/fan/payments/[id]/receipt`) — 멤버십·포스트·프로그램·작품 통합
정산·멤버:
- [ ] 38 정산 지급 설정 (`/dashboard/creator/payout-settings`) — 계좌·사업자(개인/개인사업자/법인)·검증상태
- [ ] 39 멤버 관리 (`/dashboard/creator/members`) — MemberList

**기존 화면 갱신 필요 (코드 변경 반영)**
- [ ] 13 팬 홈 — 작품주문 placeholder(238:5106)를 실제 작품 주문 목록으로 교체
- [ ] 12 프로그램 상세 — 신청 동선이 모달→checkout 페이지(35)로 변경, ProgramFaqSection 추가
- [x] 작품 커머스 마스터 5종 생성 완료(2026-06-24): ArtworkProductCard(245:1287)·ArtworkOrderCard(246:1312)·ArtworkForm(247:1262)·ShipmentForm(248:1262)·CheckoutSummaryCard(249:1262)
- [x] 영수증·정산 마스터 3종 생성 완료(2026-06-24): ReceiptCard(252:1262)·PayoutStatusCard(253:1262)·PayoutSettingsForm(253:1278)
- 작품 커머스+영수증+정산 = 신규 마스터 8종 모두 준비됨. 화면 30~38 인스턴스 조립 가능

---

## 8. 미해결 TODO

- **작품 주문(Artwork Order) 컴포넌트**: 코드 쪽(`src/app/api/creator/artworks/`, `src/app/api/creator/works/`, `src/components/artworks/CreatorAssetManager.tsx`)에서 작업 중. 피그마 공유되면 13번 팬 홈의 placeholder(점선 박스) 교체.
- 코드 갭(랜딩 카드 3포맷·LockedPostCard/MembershipPlanCard 섹션 등)은 `ArtBridge_화면목록_2026-06-23.md` "코드 구현 필요" 절 참조.

---

*이 문서는 피그마 정본 `kRXui45SIlfWK80VhLJnt9` 기준. 화면 추가 시 4·5절 표를 갱신할 것.*
