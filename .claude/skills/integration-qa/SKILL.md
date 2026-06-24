---
name: integration-qa
description: |
  artbridge 통합 QA를 수행할 때 사용한다. 프로젝트의 실제 검증 게이트(npm run typecheck / npm run lint / vitest / Playwright E2E)를 실행하고, 백엔드 API 응답 shape과 프론트엔드 소비 코드를 경계면에서 교차 비교하여 정합성 결함을 찾는다.
  QA 검증/통합 테스트/경계면 검증/API-프론트 정합성/타입 검증/검증 게이트/회귀 검증 요청 시, 그리고 풀스택 파이프라인에서 모듈 완성 직후마다 반드시 사용할 것. 새 테스트 전략 설계나 기능 구현과는 구분된다 — 이 스킬은 검증·대조 전용이다.
---

# Integration QA — 검증 게이트 + 경계면 교차 비교

artbridge의 품질 검증 전담 스킬. 핵심은 "파일이 있는가" 확인이 아니라 **두 경계(프론트↔백엔드, 코드↔스키마)를 동시에 읽고 shape을 대조**하는 것이다.

## 왜 경계면인가

단위 테스트가 모두 통과해도 통합은 깨질 수 있다. 가장 빈번한 실서비스 버그는 경계면에서 발생한다: API가 `{ data: [...] }`를 주는데 프론트가 배열을 직접 기대하거나, Prisma의 snake_case 물리 컬럼이 응답에서 camelCase로 변환되지 않거나, 날짜가 문자열로 직렬화되는데 프론트가 Date를 기대하는 식이다. 단일 파일만 보면 절대 안 보인다 — 양쪽을 동시에 읽어야 한다.

## 검증 게이트 (반드시 실제 실행)

```bash
npm run typecheck     # tsc --noEmit — 타입 경계 1차 방어선
npm run lint          # eslint
npx vitest run        # 유닛 (src/lib/queries/*.test.ts 등)
npx playwright test   # E2E (설정되어 있을 때)
```

- 한 게이트 실패가 다른 게이트를 막지 않는다. 모두 실행 후 종합한다.
- 환경 차단(DB 미연결 등)과 코드 결함을 구분한다. 차단은 `blocked`로 표기.
- 각 게이트의 **실제 출력**(통과/실패 카운트)을 보고서에 인용한다. 추정 금지.

## 경계면 교차 비교 절차

1. **API 계약 추출** — 검증 대상 `src/app/api/**/route.ts`를 읽고 응답 JSON의 키·중첩·타입·null 가능성을 표로 정리한다.
2. **소비처 추출** — 그 API를 호출하는 프론트(`src/components/**`, `src/lib/queries/**`)를 Grep으로 찾아 기대 타입을 정리한다.
3. **대조** — 키 이름, 중첩 깊이(`data.items` vs `items`), 옵셔널/널, 날짜 직렬화(string vs Date), 배열 vs 단일을 항목별로 비교한다.
4. **스키마 정합성** — zod 스키마(`src/lib/validation`)와 Prisma 모델(`prisma/schema.prisma`, snake_case @map 주의)이 실제 요청/응답과 일치하는지 확인한다.

## 출력 스키마 — `_workspace/pipeline/05_qa-report.md`

```markdown
# QA Report: {범위}

## 게이트 결과
| 게이트 | 명령 | 결과 | 비고 |
|--------|------|------|------|
| typecheck | npm run typecheck | PASS/FAIL/blocked | (출력 인용) |
| lint | npm run lint | ... | |
| unit | npx vitest run | N passed / M failed | |
| e2e | npx playwright test | ... | |

## 경계면 불일치
| 위치(파일:라인) | 기대 | 실제 | 심각도 | 수정 담당 |
|-----------------|------|------|--------|-----------|

## 판정
- **배포 가능 여부:** PASS / FAIL
- FAIL 시: 차단 결함 목록 + 각 결함의 수정 담당 에이전트(expert-frontend / expert-backend)
```

## 원칙

- **점진적 실행**: 전체 완성 후 1회가 아니라 모듈 완성 직후마다 그 경계만 검증한다(incremental QA). 빠른 피드백이 통합 버그 비용을 줄인다.
- **수정 분리**: 결함은 분류·보고만 한다. 명백한 한 줄 수정은 예외로 허용하되 보고서에 기록한다.
- **증거 우선**: 모든 판정은 실제 명령 출력 또는 파일 라인 인용으로 뒷받침한다.
