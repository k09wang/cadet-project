# ArtBridge UI 고급화 계획 (토스·네이버·원티드 레퍼런스)

> 작성일: 2026-06-24 · 정본 `kRXui45SIlfWK80VhLJnt9`
> 목적: GLM이 조립한 39화면이 "와이어프레임 같고 고급스럽지 않은" 문제를 컴포넌트 마스터 수정으로 일괄 해결.
> 원칙: **마스터를 고치면 전 인스턴스에 전파** → 화면 39개를 개별 손대지 않고 한 번에 끌어올린다.

---

## 0. 진단 요약 (4개 대표화면 표본: 08 목록 / 19 대시보드 / 27 정산 / 35 결제)

| 요인 | 영향 범위 | 해결 위치 |
|---|---|---|
| ① 빈 썸네일 박스(그라데이션만) | 모든 카드 | 카드 마스터 미디어 |
| ② 그림자(elevation) 전무 | 모든 카드/패널 | Effect Style + 카드 마스터 |
| ③ placeholder 텍스트 반복 | 19 바로가기·35 FAQ 등 | 화면 인스턴스 (Phase 4) |
| ④ 타이포 위계 약함 | 전역 | 텍스트 크기/굵기 토큰 + 마스터 |
| ⑤ 배경·여백 리듬 단조 | 전 화면 셸 | buildShell 배경색 + 간격 |
| ⑥ 디테일 조악(raw `^`, 빈 아바타) | 아코디언·아바타 | 해당 마스터 |
| ⑦ 촌스런 그라데이션·색 | 미디어 | 미디어 트리트먼트 규칙 |
| ⑧ CTA·테이블 depth 없음 | 버튼·테이블 | 버튼 마스터·리스트 |

---

## 1. 디자인 토큰 보강 (먼저)

### 1-1. Elevation(그림자) — 신규 Effect Style 3종
토스식 soft shadow. 보더는 얇게 남기되 그림자가 주역.
- `elevation/card` (resting): `0 1px 2px rgba(16,24,40,0.04)` + `0 1px 3px rgba(16,24,40,0.06)`
- `elevation/raised` (강조 카드·요약): `0 4px 16px rgba(16,24,40,0.06)` + `0 1px 3px rgba(16,24,40,0.05)`
- `elevation/overlay` (모달·팝오버): `0 12px 32px rgba(16,24,40,0.12)`
- 색 기준 #101828(rgb 0.063,0.094,0.157).

### 1-2. 배경색 토큰 보정
- 현재 셸 배경 `{0.98,0.985,0.99}` → **쿨그레이 `#F7F8FA`(0.969,0.973,0.980)** 로 통일(토스 톤). 흰 카드와 대비를 줘 카드가 "떠 보이게".
- `surface/subtle`(#FAFAFA)는 카드 내부 보조 영역 유지.

### 1-3. 라운드 상향
- 카드 radius `md(12)` → **`lg(16)`** 로(토스/원티드 톤). 작은 칩/배지는 유지.

### 1-4. 타이포 위계 (텍스트 스타일 재정의 또는 마스터 직접)
| 용도 | 현재 | 변경 |
|---|---|---|
| 페이지 타이틀 | 24 Bold | **28 Bold**, letter-spacing -1% |
| 섹션 타이틀 | 18 Bold | **20 Bold** |
| 카드 타이틀 | 16 Bold | **17 Bold** |
| 보조 텍스트 | 13~14 muted(#8e8e8e) | **#8C94A3**(약간 쿨톤), line-height 1.5 |
| 수치(가격·통계) | 15 Bold | **18~22 Bold**, 강조 |

---

## 2. 컴포넌트 마스터 수정 (전파 핵심)

### 2-1. 카드 전반 — elevation + radius + border
대상: CreatorCard(2:69), ProgramCard(2:81), MembershipPlanCard(2:93), LockedPostCard(2:105),
ArtworkProductCard(245:1287), ArtworkOrderCard(246:1312), CheckoutSummaryCard(249:1262),
ReceiptCard(252:1262), PayoutStatusCard(253:1262), Stat Card(10:474), FanProfileCard(237:1262),
Studio Summary Card(94:792), 신규 포맷 3종(157:918/926/932).
- effect `elevation/card` 적용, border `#EEEEEE`→`#F0F1F3`(더 옅게) 또는 제거, radius lg.

### 2-2. 썸네일 실체화 (가장 큰 효과)
빈 그라데이션 박스 → 둘 중 택1(아래 D 결정):
- **(A) 실제 이미지**: `figma.createImageAsync(url)`로 Unsplash 류 카테고리별 사진을 미디어 fill에 주입. (원격 환경 fetch 가능 여부 1개로 선검증)
- **(B) 고급 그라데이션 + 카테고리 글리프**: 촌스런 보라-청록 → 카테고리별 절제된 듀오톤(예: 사진=슬레이트, 일러스트=세이지, 음악=인디고) + 중앙 대형 반투명 아이콘 + 미세 톤. 이미지 없이도 "의도된" 느낌.

### 2-3. 디테일 컴포넌트
- **Accordion Item(10:467)**: raw `^` → 벡터 chevron(시계 12→6 회전), padding 정리, 활성시 배경 `surface/subtle`.
- **Avatar(10:424)**: 빈 회색 원 → 브랜드 틴트 그라데이션 + 이니셜(흰 Bold). 링(보더) 옵션.
- **Stat Card(10:474)**: 큰 수치(22 Bold) + 작은 라벨(12 muted) + 미세 상승 화살표 색(success). 보더 제거+elevation.
- **Quick Action Tile(92:844)**: 아이콘 박스는 유지, 그림자 추가, hover 톤. (라벨 반복은 Phase 4)
- **Button(2:18)**: Primary에 미세 그림자 `0 1px 2px rgba(brand,0.3)`, pressed 톤.

### 2-4. 테이블/리스트
- SettlementListItem(22:7xx)·ListItem(10:438): row hover 톤(surface/subtle), 구분선 옅게, 아바타 채움.

---

## 3. 셸·레이아웃 (buildShell 갱신)
- Main 배경 `#F7F8FA`.
- content 상단 여백 40→**56**, 섹션 간 24→**32**(숨통).
- 페이지 타이틀 28 Bold 적용(titleBlock 갱신).
- 향후 GLM 프롬프트의 PREAMBLE도 동일 반영(`ArtBridge_GLM_화면생성_프롬프트.md` B절 업데이트).

---

## 4. 인스턴스 더미 차별화 (마스터로 안 되는 것)
화면에 직접 박힌 반복 텍스트 수정(스크립트로 일괄):
- 19 대시보드 Quick Action 5개: 포스트 작성 / 멤버십 관리 / 프로그램 관리 / 정산 현황 / 멤버 관리 (+ 각 설명·도메인색).
- 35·기타 FAQ 3개: 환불/일정 변경/준비물 등 서로 다른 Q&A.
- 빈 아바타·반복 더미 전반.

---

## 5. 실행 단계 (우선순위)

| Phase | 내용 | 효과 | 범위 |
|---|---|---|---|
| **P1** | Effect Style 3종 + 카드 마스터 일괄(elevation·radius·border) + 셸 배경/여백/타이포 | ⭐⭐⭐ 평면→입체, 즉각 "고급" | 마스터 ~15종 + buildShell |
| **P2** | 썸네일 실체화(A 또는 B) | ⭐⭐⭐ 와이어프레임감 제거 | 카드 미디어 마스터 |
| **P3** | 디테일(아바타·아코디언·스탯·버튼·테이블) | ⭐⭐ 완성도 | 마스터 ~6종 |
| **P4** | 인스턴스 더미 차별화 | ⭐ 성의·현실감 | 화면 19·35 등 |

> P1·P2가 체감 80%. P1은 마스터 수정만으로 39화면 전부 즉시 개선.

---

## 6. 진행 기록

**P1 완료 (2026-06-24)**
- Effect Style 3종 생성: `elevation/card`(S:90df…), `elevation/raised`(S:d3d9…), `elevation/overlay`(S:0645…).
- 카드 마스터 23종 + App Shell 6종(Studio Summary=raised, Quick Action Tile×5=card)에 그림자 적용 → 전 화면 인스턴스 전파.
- 전 화면(38개) Main 배경을 쿨그레이 `#F7F8FA`로, 셸 Content 간격 24→32, paddingTop→56.
- 함정: `Content`가 카드 내부 프레임명과 겹쳐 itemSpacing=32가 카드 169개 내부까지 먹음 → **셸 Content(부모가 Main)만 32 유지, 카드 내부 133개는 6으로 복원**.
- GLM 프롬프트 `buildShell`/`titleBlock`도 동일 베이스라인으로 갱신(bg/56/32/타이틀28).

**P2 완료 (2026-06-24, 방식 B=고급 그라데이션+아이콘)**
- 레거시 카드 4종(CreatorCard 2:69=image / ProgramCard 2:81=calendar / LockedPostCard 2:105=lock / MembershipPlanCard 2:93=crown) + ArtworkProductCard 3변형 미디어: 정돈된 듀오톤 그라데이션 + 중앙 lucide 라인 아이콘(`createNodeFromSvg`, #94A0AE) → "빈 박스" 제거. 마스터 수정→전파.

**P2 잔여 커버 완료 (2026-06-24)**
- RECTANGLE 커버 → 그라데이션 FRAME + 중앙 이미지 아이콘으로 교체(`coverize` 패턴: 같은 index에 frame insert 후 rect remove): ProgramDetail Recruiting(54:722)/Closed(54:737), StudioProfileHeader 3변형 CoverBanner, PostArticle Image(205:899), PostDetail Free 이미지(53:733). (Members/Paid PostDetail은 잠금 콘텐츠 박스라 유지)

**P3 완료 (2026-06-24)**
- Accordion(10:467): raw `⌃` TEXT 제거 → 벡터 chevron-down(`createNodeFromSvg`), 타이틀 프레임 FILL로 우측 정렬.
- Avatar(10:424) + StudioProfileHeader Avatar(172:3883) + SettlementListItem 3변형 avatar 엘립스: 청록→인디고 그라데이션 fill, 이니셜 흰 Bold.
- Stat Card delta(10:478) → success 색.
- Button Primary(2:6/2:8): elevation/card 그림자.

**P4 완료 (2026-06-24)**
- 19 대시보드 Quick Action 5개: 포스트 작성/프로그램 관리/멤버십 관리/정산 현황/멤버 관리 + 각 설명 차별화(인스턴스 텍스트 오버라이드 `I{inst};{master}`).
- 35 FAQ 3개: 환불/일정 변경/준비물 서로 다른 Q&A.

**남은 미세 항목(선택)**: Studio Summary 통계 스트립의 옅은 teal 밴드 정리, 테이블 row hover/zebra. 체감 영향 작음.

## 7. 변경 이력
| 날짜 | 내용 |
|---|---|
| 2026-06-24 | 초안 + P1·P2·P3·P4 전체 실행 완료. 마스터 중심 수정으로 39화면 일괄 고급화. |
