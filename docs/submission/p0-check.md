# P0 전수 점검 결과 (배포본 런타임)

> 대상: https://cadet-project.vercel.app · 일시: 2026-06-29
> 방법: Playwright로 **게스트/팬/작가** 권한 전 페이지 라우트 탐색 → 5xx·런타임 크래시·에러오버레이·빈화면 검출
> 계정: `fan1@artbridge.demo` · `creator@artbridge.demo` (`demo1234!`)

## 결과: 44개 페이지 라우트 전부 정상 — **FAIL 0 · 404 0 · 크래시 0**

| 권한 | 라우트 수 | 결과 |
|---|---|---|
| 게스트(공개) | 13 | 전부 200 정상 |
| 팬(로그인) | 13 | 전부 200 정상 |
| 작가(로그인) | 18 | 전부 200 정상 |
| **합계** | **44** | **전부 200 · 차단 오류 없음** |

- 동적 상세 라우트(계약 `/contracts/[id]`, 체크아웃 3종, 작가 프로그램 하위 `/dashboard/creator/programs/[id]/...`, 멤버십 편집 등)도 전부 200 렌더.
- 단위 테스트 709 green과 **별개로**, 배포본 런타임 차원에서도 P0 통과를 확인.

## 점검 라우트 목록

**게스트(13):** `/` · `/creators` · `/creators/[id]` · `/programs` · `/programs/[id]` · `/login` · `/signup` · `/support` · `/terms` · `/privacy` · `/design-system` · `/wireframes` · `/posts/[id]`

**팬(13):** `/dashboard/fan` (+ applications · artwork-orders · bookmarks · memberships · payments · profile) · `/notifications` · `/artworks/[id]/checkout` · `/programs/[id]/checkout` · `/creators/[id]/memberships/[planId]/checkout` · `/contracts/[id]` · `/artwork-orders/[id]`

**작가(18):** `/dashboard/creator` (+ artwork-orders · artworks · edit · members · memberships · memberships/new · payout-settings · posts/new · programs · programs/new · settlements · works · programs/[id] · programs/[id]/applications · programs/[id]/edit · programs/[id]/participants · memberships/[id]/edit)
