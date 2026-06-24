---
name: fullstack-pipeline
description: |
  artbridge 풀스택 웹 개발을 와이어프레임부터 Vercel 배포까지 하나의 파이프라인으로 조율하는 오케스트레이터. 디자인→프론트엔드→백엔드→QA→배포 단계를 전담 에이전트와 기존 MoAI/Vercel 에이전트로 엮어 실행한다.
  새 기능/화면/페이지 개발, 풀스택 기능 구현, "처음부터 끝까지 만들어줘", 파이프라인 실행 요청 시 반드시 사용할 것. 또한 후속 작업(다시 실행, 재실행, 업데이트, 수정, 보완, 특정 단계만 다시, 이전 결과 기반 개선)에도 사용한다. 단순 질문이나 단일 파일 수정에는 사용하지 않는다.
---

# Fullstack Pipeline Orchestrator (artbridge)

artbridge(Next.js 16 / React 19 / Prisma 6 / NextAuth 5 / shadcn+Tailwind4 / Vitest+Playwright / Vercel) 기능을 와이어프레임→배포까지 조율하는 오케스트레이터.

**실행 모드:** 에이전트 팀(기본). 단계 간 강한 의존성 때문에 작업은 순차 진행되지만, TaskCreate 의존성과 SendMessage로 자체 조율한다. QA는 모듈 완성 직후마다 점진적으로 끼어든다.

**재사용 우선:** 신규 에이전트는 1·5단계 둘뿐이다. 나머지는 기존 MoAI/Vercel 에이전트를 호출한다. 모든 Agent 호출에 `model: "opus"`를 명시한다.

## 파이프라인 단계 & 담당

| 단계 | 담당 에이전트 | 사용 스킬 | 산출물 |
|------|--------------|----------|--------|
| 1. 와이어프레임 | `wireframe-architect` (신규) | `wireframing` | `01_wireframe.md` |
| 2. 디자인 | `expert-frontend` (재사용) | `moai-domain-brand-design`, `moai-domain-uiux`, `moai-library-shadcn` | `02_design-tokens.json` + `02_component-specs.md` |
| 3. 프론트엔드 | `expert-frontend` (재사용) | `moai-domain-frontend`, `moai-ref-react-patterns`, `moai-library-shadcn` | 컴포넌트 코드 + `03_components.md` |
| 4. 백엔드 | `expert-backend` (재사용) | `moai-domain-backend`, `moai-domain-database`, `moai-ref-api-patterns` | API 라우트/Prisma/zod + `04_api-spec.md` |
| 5. QA | `qa-integration` (신규) | `integration-qa` | `05_qa-report.md` |
| 6. 배포 | `expert-devops` (재사용) | `moai-platform-deployment`, Vercel `deploy`/`env`/`deployments-cicd` 스킬 | 배포 결과 보고 |

## Phase 0: 컨텍스트 확인 (워크플로우 시작 시 항상)

`_workspace/pipeline/` 존재 여부로 실행 모드를 판별한다:
- **미존재** → 초기 실행 (1단계부터)
- **존재 + 사용자가 특정 단계 수정 요청** → 부분 재실행 (해당 에이전트만, 이전 산출물 읽고 개선)
- **존재 + 새 기능 입력** → 새 실행 (기존 `_workspace/pipeline/`를 `_workspace/pipeline_prev/`로 이동 후 1단계부터)

## 데이터 전달 프로토콜 (파일 기반 핸드오프)

모든 단계 간 산출물은 `_workspace/pipeline/`에 약속된 경로로 쓰고 읽는다. 중간 파일은 보존한다(감사·재실행용). 최종 코드만 `src/`에 출력된다.

**핸드오프 계약:**
- `01_wireframe.md` (와이어프레임 → 디자인): 화면 목록, 레이아웃 영역, 컴포넌트(신규/재사용), 흐름, 상태, 데이터 의존성.
- `02_design-tokens.json` (디자인 → 프론트): `{ colors, typography, spacing, radius, shadows }` 형태의 토큰. `02_component-specs.md`는 컴포넌트별 변형(variant)·상태·접근성 요구.
- `03_components.md` (프론트 → QA): 구현된 컴포넌트 목록과 각 컴포넌트가 호출하는 API 엔드포인트, 기대 응답 타입.
- `04_api-spec.md` (백엔드 → QA·프론트): 엔드포인트별 메서드·요청 zod 스키마·응답 JSON shape·인증 요구. **프론트와 백엔드가 공유하는 단일 진실원천.**
- `05_qa-report.md` (QA → 배포): 게이트 결과 + 경계면 불일치 + PASS/FAIL 판정.

## 검증 게이트 (단계별 통과 기준)

각 코드 산출 단계 완료 시 `qa-integration`이 실행:
```
npm run typecheck   →   npm run lint   →   npx vitest run   →   npx playwright test
```
6단계(배포)는 `05_qa-report.md`가 **PASS**일 때만 진행한다. FAIL이면 결함을 해당 에이전트(expert-frontend/expert-backend)에 되돌리고 재검증한다.

## 오케스트레이션 흐름 (에이전트 팀)

```
[리더 = 오케스트레이터]
  ├── Phase 0: 컨텍스트 확인 (_workspace/pipeline/ 점검)
  ├── TeamCreate(team: artbridge-pipeline)
  ├── 1단계: Agent(wireframe-architect, model=opus) → 01_wireframe.md
  ├── 2단계: Agent(expert-frontend, model=opus, 디자인 스킬) → 02_*
  ├── 3·4단계: Agent(expert-frontend) + Agent(expert-backend) 병렬
  │            └ 04_api-spec.md를 먼저 합의 → 프론트/백 동시 진행
  ├── 5단계: 모듈 완성마다 Agent(qa-integration, model=opus) → 05_qa-report.md
  │            └ FAIL → 담당 에이전트에 SendMessage 후 재검증 (최대 3회)
  ├── 6단계: PASS 시 Agent(expert-devops, model=opus, vercel 스킬) → 배포
  └── 결과 종합 + TeamDelete
```

3·4단계는 `04_api-spec.md`(API 계약)를 먼저 확정하면 병렬 가능하다. 계약 미확정 시 백엔드를 선행한다.

## 에러 핸들링

- 에이전트 실패 시 1회 재시도. 재실패하면 해당 산출물 없이 진행하지 않고 리더가 사용자에게 보고한다(필수 단계는 건너뛰지 않음).
- QA FAIL 루프는 최대 3회. 3회 후에도 미통과면 결함 보고서와 함께 사용자에게 에스컬레이션한다.
- 상충하는 산출물(예: API 계약 vs 프론트 기대)은 삭제하지 않고 양쪽 출처를 병기하여 보고한다.

## 후속 작업 지원

이 스킬은 초기 실행뿐 아니라 "다시", "수정", "보완", "특정 단계만" 요청도 처리한다. Phase 0에서 부분 재실행을 판별하면 해당 단계 에이전트만 호출하고, 그 에이전트는 이전 산출물을 읽어 개선 모드로 동작한다. 변경 후 영향받는 다운스트림 단계(특히 QA)는 재실행한다.

## 테스트 시나리오

**정상 흐름:** "프로그램 상세 페이지에 후기 섹션 추가" → 와이어프레임(후기 화면 영역·상태 정의) → 디자인 토큰 → 프론트 컴포넌트 + 백엔드 `/api/programs/[id]/reviews` → QA(typecheck/lint/vitest 통과 + API shape↔프론트 대조) → PASS → Vercel 프리뷰 배포.

**에러 흐름:** 4단계에서 API가 `{ reviews: [...] }`를 반환하는데 3단계 프론트가 배열을 직접 기대 → 5단계 qa-integration이 `05_qa-report.md`에 경계면 불일치(FAIL, 수정 담당: expert-backend 또는 expert-frontend) 기록 → 리더가 담당 에이전트에 수정 요청 → 재검증 → PASS 후 배포.
