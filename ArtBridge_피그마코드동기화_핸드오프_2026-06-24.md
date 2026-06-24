# ArtBridge 피그마 → 코드 동기화 핸드오프

> 이 문서 하나로 **피그마 접근 없이** 코드만으로 동기화를 이어갈 수 있도록 모든 토큰값·컴포넌트 스펙·변경목록을 박아두었습니다. Codex(또는 다른 세션)에 이 문서를 통째로 주고 시작하세요.

---

## 0. 한 줄 요약

피그마(`kRXui45SIlfWK80VhLJnt9`)에서 39화면 디자인 QA를 끝냈고, 그 결과를 기존 Next.js 16 코드(`/Users/hanjin/codeit`)에 반영하는 중. **브랜치 `figma-code-sync`**(main에서 분리)에서 작업. **1층(토큰)은 이미 완료**, 다음은 2층(컴포넌트)·3층(화면).

---

## 1. 작업 모델 — "3층 비유"

- 🎨 피그마 = 설계도 / 💻 코드 = 실제 작동하는 웹사이트
- 디자인의 **모양·색·간격·배치만** 옮긴다. 피그마의 **가짜 사진·가짜 이름·가짜 금액은 안 옮긴다**(코드는 진짜 DB 데이터를 씀).
- 일부 항목은 **코드가 정답**이라 피그마를 코드에 맞춰놨다(대표: 진행단계 스테퍼). → 이런 건 코드 변경 불필요.

| 층 | 내용 | 파일 위치 |
|----|------|-----------|
| 1층 | 색·간격·그림자·radius 토큰 | `src/app/globals.css` |
| 2층 | 버튼·카드·입력칸·리스트아이템 등 재사용 부품 | `src/components/ui/*`, `src/components/<도메인>/*` |
| 3층 | 페이지 조립 | `src/app/(app)/**/page.tsx` |

---

## 2. ✅ 1층(토큰) — 이미 완료. 다시 하지 말 것

`src/app/globals.css`에서 아래만 변경 완료(typecheck·dev서버·콘솔 검증 끝):

1. 셸 배경: `--surface-canvas: #f7fbfa` → **`#f7f8fa`** (쿨그레이)
2. Elevation 그림자 5개를 피그마 effect style(쿨톤 `rgba(16,24,40)`)로 재정렬:
   ```css
   --elevation-1: 0px 1px 2px rgba(16,24,40,0.04), 0px 1px 3px rgba(16,24,40,0.06); /* elevation/card */
   --elevation-2: 0px 1px 3px rgba(16,24,40,0.05), 0px 4px 16px rgba(16,24,40,0.06); /* elevation/raised */
   --elevation-3: 0px 2px 8px rgba(16,24,40,0.08);   /* Elevation/01 */
   --elevation-4: 0px 8px 24px rgba(16,24,40,0.12);  /* Elevation/02 */
   --elevation-layered: 0px 12px 32px rgba(16,24,40,0.12); /* elevation/overlay */
   ```
3. `@theme`에 별칭 추가: `--shadow-card / --shadow-raised / --shadow-overlay` (→ `shadow-card` 등 Tailwind 유틸 생성). **2층에서 verbose한 `shadow-[var(--elevation-1)]`를 `shadow-card`로 바꿔 쓰면 됨.**

**결론:** 색·radius·spacing은 코드가 원래 피그마 foundations에서 생성돼 **처음부터 일치**. 1층 추가 작업 없음.

### 2-1. 피그마 토큰 전체 레퍼런스 (코드와 대조용 — 피그마 안 봐도 됨)

ArtBridge Tokens 컬렉션(Light 모드):

| 토큰 | 값 | 코드 변수 | 상태 |
|------|-----|-----------|------|
| brand/primary | `#15c5ce` | `--brand-primary` | ✓ |
| brand/primary-strong | `#00abb6` | `--brand-primary-pressed` | ✓ |
| brand/primary-soft | `#e0fbf9` | (코드엔 `--brand-subtle:#eefcfc`) | 미세차이, 선택 |
| brand/primary-wash | `#f2fefd` | `--surface-tint` | ✓ |
| surface/default | `#ffffff` | `--surface-panel` | ✓ |
| surface/subtle | `#fafafa` | `--surface-subtle` | ✓ |
| text/default | `#1f1f1f` | `--text-default` | ✓ |
| text/muted | `#8e8e8e` | `--text-muted` | ✓ |
| border/default | `#eeeeee` | `--border-default` | ✓ |
| semantic/success | `#47b881` | `--success` | ✓ |
| semantic/warning | `#ffad0d` | `--warning` | ✓ |
| semantic/danger | `#f64c4c` | `--danger` | ✓ |
| semantic/info | `#3b82f6` | `--info` | ✓ |
| domain/membership | `#7c3aed` | `--membership` | ✓ |
| domain/program | `#2563eb` | `--program` | ✓ |
| domain/community | `#10b981` | `--community` | ✓ |
| focus/ring | `#15c5ce` | `--ring` | ✓ |
| **overlay/backdrop** | `#0b1113` | 없음 | 선택 추가 |
| **domain/membership-wash** | `#f5f3ff` | 없음 | 선택 추가 |
| **domain/community-wash** | `#ecfdf5` | 없음 | 선택 추가 |
| radius | none0/xs2/sm4/md6/lg8/xl12/2xl16/modal20/full999 | `--radius-*` | ✓ |
| space | 0/1=4/2=8/3=12/4=16/5=20/6=24/8=32/10=40/12=48/16=64 | Tailwind 기본 | ✓ |

> 위 "선택 추가" 3개는 **그걸 쓰는 컴포넌트를 만들 때만** 추가. 지금 미리 넣지 말 것(미사용 토큰 = 노이즈).

피그마 Effect Styles(이미 2층 토큰에 반영됨): `elevation/card`, `elevation/raised`, `elevation/overlay`, `ArtBridge/Elevation/01·02`.

---

## 3. 🔜 2·3층 — 실제 코드 작업 목록

> **중요:** 피그마 QA 변경분 중 상당수는 (a) 코드가 이미 정답이거나 (b) 피그마 전용 가짜콘텐츠라 **코드 변경이 필요 없다.** 아래 표가 그 구분이다.

### 3-A. 코드에서 실제 고칠 것 (레이아웃/정렬)

| # | 피그마 QA 내용 | 코드 타깃(추정) | 해야 할 일 |
|---|----------------|-----------------|-----------|
| 1 | 리뷰 아이템 상태배지 우측정렬(ApplicationReviewItem) | `src/components/programs/` 또는 `applications/` 리뷰 아이템 | 행을 `flex justify-between`, 배지를 `ml-auto`로 우측 고정 |
| 2 | 알림/멤버 리스트 태그 우측정렬(ListItem) | `src/components/notification/*`, `dashboard/creator/members` 관련 | 내부 라벨 폭 FIXED 제거, 행 `justify-between` |
| 3 | 통계박스 회색→흰색+보더(StatsPanel) | `src/components/studio/*`(스튜디오 요약), `dashboard/fan` 프로필카드 | 배경 `bg-[#fafafa]`→`bg-white`, `border border-border-default rounded-[12px]` |
| 4 | 정산 요약 전체폭 분산(SettlementSummary StatCell) | `src/components/dashboard/` 정산 요약 | StatCell 컨테이너 `flex-1`(FILL)로 균등분산 |
| 5 | 작품등록 폼 좌측정렬/너비 통일(ArtworkForm) | `src/components/artworks/*Form*` | 폼 컨테이너 정렬 `items-start`, 모달 폭을 판매목록과 통일 |
| 6 | 입력칸 폭 꽉 채우기(InputField FILL) | `src/components/ui/input.tsx` + 각 폼 | input `w-full`, 라벨/박스 폭 고정 제거 |

> 각 항목은 **먼저 해당 page.tsx를 dev서버로 열어 현재 상태를 보고**, 어긋난 것만 고친다. 이미 맞아있으면 건드리지 말 것(scope discipline).

### 3-B. 코드 변경 불필요 (이미 코드가 정답 / 피그마를 코드에 맞춤)

- **진행단계 스테퍼**: `src/components/applications/MyApplicationItem.tsx`가 정답. 단계 5개=신청·결제·참여 확정·진행·완료(선착순이라 "계약" 없음). 피그마를 이 코드에 맞춰놨으므로 **코드 변경 없음**.

### 3-C. 피그마 전용 — 코드로 옮기지 말 것

- **G1 듀오톤 썸네일**(슬레이트/틸/그린/바이올렛/앰버): 피그마는 가짜 플레이스홀더 미디어라 듀오톤 처리. 코드는 진짜 업로드 이미지를 쓰므로 **그대로 둠**.
- **가짜 콘텐츠**(이름 "김한진", 이메일 `hanjin@example.com`, 금액 150,000 등, 헤더 활성 nav, 카드 6장 차별화 텍스트): 전부 피그마 더미. 코드는 DB 데이터 → **옮기지 않음**.

### 3-D. 보류(절대 건드리지 말 것)

- 29번 계약서 **금액 조율 섹션**(AmountNegotiationPanel): 사용자가 "수정하지 마" 지정.

---

## 4. 권장 진행 순서

1. **팬 신청 현황** 화면부터: `src/app/(app)/dashboard/fan/applications/page.tsx` + `applications/MyApplicationItem.tsx`(스테퍼는 이미 정답이니 확인만) + `dashboard/fan` 프로필 통계박스(3-A #3).
2. 한 화면에서 2층(부품)→3층(페이지) 한 바퀴 돌며 3-A 항목 처리 → 검증 → 커밋.
3. 나머지 화면 같은 패턴 반복.
4. verbose `shadow-[var(--elevation-1)]` → `shadow-card`로 점진 치환(선택, 한 번에 안 해도 됨).

---

## 5. 코드베이스 사실관계

- **스택**: Next.js 16(App Router, `--webpack`) + React 19 + Tailwind **v4**(설정은 `src/app/globals.css` `@theme`, `tailwind.config` 없음) + Prisma. shadcn 프리미티브.
- **컴포넌트 도메인**: `applications artworks community contracts creators dashboard design-system home notification posts programs studio ui wireframes`
- **ui 프리미티브**: `badge button card dialog input toast`
- **검증 명령**:
  - `npm run typecheck` (tsc --noEmit)
  - `npm run lint` (eslint)
  - `npm run test` (vitest, **mock 기반 — vi.hoisted 필수**)
  - `npm run test:e2e` (playwright)
  - `npm run dev` (포트 3000)
- **dev 서버 주의**: 이미 떠 있으면 `.next/dev/lock`이 죽은 PID를 잡고 있을 수 있음 → `lsof -ti:3000 | xargs kill -9; rm -f .next/dev/lock` 후 재시작.

---

## 6. 검증 워크플로 (각 변경마다)

1. `npm run typecheck` 통과 확인
2. dev서버에서 해당 page 열어 스크린샷 → 어긋남 해소 확인
3. 콘솔 에러 0 확인
4. 관련 vitest 있으면 실행
5. 의미 단위로 커밋(`figma-code-sync` 브랜치)

---

## 7. Git 상태

- 현재 브랜치: `figma-code-sync` (main에서 분리, 아직 push 안 함)
- 변경됨: `src/app/globals.css`(1층 완료), 문서 몇 개
- 커밋/푸시는 사용자 명시 요청 시에만.

---

## 8. Codex에 붙여넣을 프롬프트 (예시)

```
ArtBridge(Next.js 16 + Tailwind v4) 프로젝트의 피그마→코드 디자인 동기화를 이어서 진행한다.
브랜치는 figma-code-sync. 먼저 리포 루트의
"ArtBridge_피그마코드동기화_핸드오프_2026-06-24.md"를 읽어라.

규칙:
- 1층(토큰, globals.css)은 이미 완료됐다. 다시 건드리지 마라.
- 피그마 가짜 콘텐츠(이름/이메일/금액/더미 이미지)는 코드로 옮기지 마라.
- 스테퍼(MyApplicationItem)는 코드가 정답이니 변경하지 마라.
- 29번 금액조율 섹션은 절대 건드리지 마라.
- 문서 3-A 표의 레이아웃/정렬 항목만 코드에서 고친다. 이미 맞아있으면 두라.

작업: 문서 4번 권장 순서대로 "팬 신청 현황" 화면부터 시작.
각 변경마다 npm run typecheck + dev서버 스크린샷으로 검증하고,
의미 단위로 커밋해라. 모든 사용자 응답은 한국어로.
```

---

## 9. 참고 문서·메모리

- 디자인 시스템 상세: `ArtBridge_00_핸드오프_INDEX.md`, `ArtBridge_피그마_작업현황_2026-06-24.md`
- QA 변경 마스터: `ArtBridge_디자인_통일감_개선계획_2026-06-24.md`
- 메모리: `artbridge-figma-code-sync`, `artbridge-design-qa-fixes`, `artbridge-figma-design-system`, `artbridge-test-and-lint-toolchain`

---

작성: 2026-06-24 / 브랜치 figma-code-sync / 1층 완료 시점
