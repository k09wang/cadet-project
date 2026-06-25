# ArtBridge 피그마 작업 — 핸드오프 INDEX (이어서 진행용)

> 최종 갱신: 2026-06-24 · 이 문서 하나로 다른 계정/세션에서 작업을 이어받을 수 있게 정리.
> ⚠️ 이전 세션의 자동 메모리는 계정 로컬이라 안 따라옴 → **필요한 모든 맥락은 이 5개 git 문서에 있음.**
> ⚠️ 다른 **기기**로 옮긴다면 이 문서들이 따라가도록 git 커밋/푸시 필요(현재 브랜치 `codex/전체흐름살펴봄`).

---

## 1. 현재 상태 (한눈에)

- **피그마 정본**: fileKey `kRXui45SIlfWK80VhLJnt9` ("ArtBridge Design System"). 코드(`globals.css`) 토큰과 정렬된 정본.
- **화면 39개 전부 조립 완료** (`🖼 Screens` 페이지). 01~14 직접, 15·작품커머스 마스터 검증분 직접, 나머지는 GLM이 프롬프트 패키지로 생성.
- **컴포넌트 마스터 ~110종** (`🧩 Components`) + 셸 5종(`🧱 App Shell`). 작품커머스 8종 신규 생성 완료.
- **UI 고급화 P1~P4 완료** (토스/네이버/원티드 톤): 그림자·쿨그레이 배경·썸네일 아이콘·아바타 그라데이션·아코디언 chevron·통계패널 정리.
- **화면 전수 QA 정리 완료**: 반복 더미 다양화·맥락 안 맞는 기본 텍스트 교정·EmptyState 오배치 제거·Fan 헤더 nav 중복 버그 수정.
- **App Header 메뉴 좌측 고정 구조로 수정**: 항목이 늘어도 위치 안 흔들리고 오른쪽으로만 자람(3변형).
- **남은 작업**: 큰 이슈 없음. 미점검 정적 화면 일부 + 선택 폴리시(아래 6절).

---

## 2. 문서 지도 (역할별)

| 문서 | 역할 |
|---|---|
| **ArtBridge_00_핸드오프_INDEX.md** (이 문서) | 진입점. 상태·환경·토큰·함정·이어가기. |
| `ArtBridge_화면목록_2026-06-23.md` | 화면 청사진 39개(영역·라우트·구성 컴포넌트) + 코드 구현 필요 항목. |
| `ArtBridge_피그마_작업현황_2026-06-24.md` | 페이지/토큰/컴포넌트 ID 카탈로그 + 완료 화면 좌표표 + use_figma 패턴·함정. |
| `ArtBridge_GLM_화면생성_프롬프트.md` | GLM 투입용 코드 패키지: 공통 PREAMBLE 헬퍼(buildShell 등) + 화면별 코드 + **전체 컴포넌트 ID 부록(D절)**. |
| `ArtBridge_UI_고급화_계획.md` | UI 고급화 진단·계획·P1~P4 실행 기록. |

코드(B 워크플로우)와의 갭은 화면목록 "🆕 확장 화면" + "코드 구현 필요" 절 참조.

---

## 3. 작업 환경·접속 (반드시)

- **Figma 원격 MCP 서버** 사용(`use_figma`/`get_screenshot`/`get_metadata`). 새 계정도 **해당 Figma 파일 접근 권한**이 있어야 함.
- **`use_figma` 호출 전 `figma-use` 스킬을 먼저 로드**(skillNames:"figma-use"). 컴포넌트 생성 시 `figma-generate-library`도.
- **페이지 ID**: System Docs `1:2` / App Shell `80:792` / Screens `80:793` / Components `121:800` / icon `105:1323`.
- **폰트**: 원격 환경엔 **Pretendard 미설치 → Noto Sans KR 사용**(코드 fallback과 정합). Inter Regular→Regular/Medium→Medium/Semi Bold→Bold.
- 스크린샷 확인: `get_screenshot` → 반환 URL을 `curl`로 `/tmp`에 받아 `Read`로 본다.

---

## 4. 핵심 토큰·스타일

- 변수 컬렉션 **`ArtBridge Tokens`** `VariableCollectionId:1:12`, modeId `1:0`. `getVariableByIdAsync('VariableID:1:NN')`로 접근.
  - 색: brand `1:13` / brand-strong `1:14` / surface `1:15` / surface-subtle `1:16` / text `1:17` / text-muted `1:18` / border `1:19` / success `1:20` / warning `1:21` / danger `1:22` / info `1:23` / membership `1:24` / program `1:25` / community `1:26`.
  - radius: sm `1:27` / md `1:28`(=12, 카드) / lg `1:29`(=16).
- 색 바인딩: `figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color', varObj)` → 반환 paint 재할당.
- **Effect Style(그림자)**: card `S:90dfa38ca9208e88fb40b0052764027d8244283d,` / raised `S:d3d916a10ab6d249ed023ad53879564ae882393d,` / overlay `S:0645a855de44bdb299efd17e0d21261c5cb5e4fa,`. 적용 `await node.setEffectStyleIdAsync(id)`.
- **셸 배경** 쿨그레이 `#F7F8FA`(rgb 0.969,0.973,0.980). 카드 radius lg(16). 페이지 타이틀 28 Bold. 셸 Content itemSpacing 32, paddingTop 56.
- **미디어 플레이스홀더**: 빈 그라데이션 박스 대신 듀오톤 그라데이션 + 중앙 lucide 라인아이콘(`figma.createNodeFromSvg`, stroke `#94A0AE`). 아바타는 청록→인디고 그라데이션 + 흰 이니셜.
- 신규 작품커머스 마스터: ArtworkProductCard `245:1287` / ArtworkOrderCard `246:1312` / ArtworkForm `247:1262` / ShipmentForm `248:1262` / CheckoutSummaryCard `249:1262` / ReceiptCard `252:1262` / PayoutStatusCard `253:1262` / PayoutSettingsForm `253:1278`. (전체 ID는 프롬프트 문서 D절)

---

## 5. 재사용 함정·패턴 (실전 검증됨)

### 레이아웃
- **FILL/HUG는 appendChild "다음"에** 설정(먼저 하면 에러).
- auto-layout 프레임 `resize(w,h)` 후 세로 FIXED로 굳음 → 세로 `primaryAxisSizingMode='AUTO'`로.
- **`combineAsVariants([...], page)` 후 변형이 (0,0)에 겹침** → set에 VERTICAL auto-layout + itemSpacing 적용해 펼침.
- **`coverize` 패턴**(빈 RECTANGLE 커버 → 그라데이션 FRAME+중앙 아이콘): 부모 children index 기억 → `insertChild(idx, frame)` → `rect.remove()` → FILL.
- 셸 조립은 프롬프트 문서 B절 `buildShell` 헬퍼 그대로 사용(헤더 Guest 84:792/Fan 83:792/Creator 82:792, Footer 56:744).

### 헤더 메뉴 좌측 고정 (2026-06-24 수정, 구조 기억)
- App Header 루트는 HORIZONTAL. **`primaryAxisAlignItems='MIN'`(좌측 고정)** + **메뉴와 우측 클러스터 사이 스페이서에 `layoutGrow=1`** → 메뉴는 로고 옆 고정 위치에서 오른쪽으로 자라고, 우측 액션은 오른쪽 끝 고정. `SPACE_BETWEEN` 쓰면 메뉴가 떠다니므로 금지.
- 변형별 구조 차이: **Creator(82:792)·Fan(83:792)** = `Header/Left(로고)` + `Spacer Before Menu` + `Menu`(여기 항목 추가) + `Spacer After Menu`(grow=1) + `Header/Right`. **Guest(84:792)** = nav가 별도 'Menu'가 아니라 `Header/Left`(로고+nav) 안에 묶임 → 순서 `[Header/Left, Spacer(grow=1), Header/Right]`.
- 메뉴 항목 추가: Fan 메뉴 프레임 `277:13130` 안의 `Menu Item` 프레임을 복제해 넣으면 자동 우측 정렬.
- 노드 재정렬은 `insertChild(index,...)`가 기대대로 안 옮겨질 때가 있음 → **`appendChild`를 원하는 순서대로 연속 호출**(맨 끝으로 이동)해 순서 확정.

### 텍스트·인스턴스 (QA에서 검증)
- 텍스트 변경/인스턴스 append 전 **폰트 로드**(Noto Sans KR Bold/Medium/Regular). 인스턴스 텍스트 오버라이드는 노드ID `I{instanceId};{masterTextId}` 또는 인스턴스 내부 TEXT를 substring 매칭.
- **substring 매칭 함정**: 화면 전체에서 substring으로 찾으면 헤더 nav 등 의도외 노드를 먼저 잡을 수 있음. 반드시 **대상 인스턴스 범위 안에서** 찾을 것(예: breadcrumb은 `INSTANCE name 'Breadcrumb'` 안에서, 헤더는 `screen.children[0]`).
- **스크린샷으로 기본 텍스트 오독 주의** — 작은 화면에서 잘못 읽기 쉬움. 정확한 기본값은 노드 inspect로 확인(예: ListItem 부제 실제값은 "홍길동 팬이 프로그램에 신청했습니다.").
- **반복 더미 다양화**: cardGrid/listCol로 같은 컴포넌트를 N개 인스턴스화하면 전부 동일 기본 텍스트 → 화면별로 인스턴스 순서(byGrid: y→x) 매핑해 서로 다른 내용 오버라이드.
- **EmptyState 오배치 주의**: 프롬프트 예시로 EmptyState를 채워진 그리드 옆에 두면 "표시할 항목 없음"이 항목과 동시에 뜸 → 실제 채워진 화면에선 제거.
- **컴포넌트 기본 라벨이 맥락과 충돌**: Button 기본 "시작하기", InputField 기본 "프로그램 제목/드로잉 클래스 4주 과정", ListItem 기본 "새 후원 신청…" 등 → 화면 맥락에 맞게 오버라이드 필수.

### 페이지
- 페이지 전환 `await figma.setCurrentPageAsync(page)` 호출당 1회. 멀티페이지는 병렬 use_figma로 분할.
- **이름 충돌 주의**: `Content`/`Media`/`Menu` 등은 카드/헤더 내부 프레임명과 겹침. 일괄 변경 시 부모/경로로 필터링(예: 셸 Content는 `parent.name==='Main'`).

---

## 6. 남은 작업 (선택, 체감 작음)

- **미점검 정적 화면**(폼/상세 위주, 위험 낮음): 02 로그인 · 03 회원가입 · 04 약관 · 05 개인정보 · 07 에러 · 10 포스트상세 · 12 프로그램상세 · 20 스튜디오편집 · 23 포스트작성 · 25 프로그램폼 · 29 계약서 · 34 작품결제 · 36 멤버십결제 · 37 영수증. (필요 시 반복 더미/맥락 텍스트 동일 패턴으로 점검)
- 테이블 row hover/zebra(정적 디자인이라 효과 작음).
- 실제 이미지 주입(`createImageAsync` 원격 fetch 가능 여부 선검증) — 현재는 고급 그라데이션+아이콘으로 대체.
- 코드 구현 필요 항목(디자인 선반영): 화면목록 "코드 구현 필요" 절 — 랜딩 신규 카드 포맷·로그인 보조·작품커머스/결제 페이지 등. (B 워크플로우상 추후 Codex 반영)

---

## 7. 이어서 시작할 때 첫 행동

1. 이 문서 + `작업현황` + `프롬프트(D절 ID)` 를 읽는다.
2. `figma-use` 스킬 로드 후, 확인하려는 화면을 `get_screenshot`(Screens 좌표는 작업현황 4절/프롬프트 배정표)로 캡처해 현 상태 파악.
3. 새 화면/수정은 위 패턴·ID로 `use_figma` 실행 → 스크린샷 검증 → 문서 갱신.

> 핵심 원칙(유지): 하드코딩 금지(컴포넌트 인스턴스로 조립), 레퍼런스는 구조만 차용·ArtBridge 토큰 유지, 카드 포맷 다양화, 반복 더미·맥락 텍스트 교정, 사용자 응답 한국어.

---

## 8. 변경 이력
| 날짜 | 내용 |
|---|---|
| 2026-06-24 | 초판 핸드오프 작성. |
| 2026-06-24 | UI 고급화 P1~P4 + 전수 QA 정리 + App Header 좌측 고정 반영해 재작성. |
