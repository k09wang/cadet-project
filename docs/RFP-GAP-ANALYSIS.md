# ArtBridge — RFP 대비 구현 갭 분석

> 기준 문서: `[실무 3-1 프로젝트] 03 RFP 제안요청서`
> 대상 코드베이스: ArtBridge (Next.js App Router + Prisma)
> 작성일: 2026-06-20

본 문서는 RFP(외주 매칭 플랫폼 `WorkBridge`)를 ArtBridge(팬↔크리에이터 멤버십 플랫폼)
도메인으로 변환한 현재 프로젝트가, RFP의 기능/비기능 요구사항을 어디까지 충족하는지를
대조하고, 추가 개발이 필요한 항목을 우선순위별로 정리한다.

---

## 1. 도메인 매핑

| RFP 구조 | ArtBridge 변환 | 코드 엔티티 |
|---|---|---|
| 의뢰인(Client) | 팬 / 후원자 / 참여자 | `User(role=FAN)` |
| 프리랜서(Freelancer) | 크리에이터 / 신진작가 | `User(role=CREATOR)` + `CreatorProfile` |
| 프로젝트 | 클럽 / 프로그램 / 멤버십 오퍼링 | `Program`, `MembershipPlan` |
| 지원 | 팬의 참여 신청 / 멤버십 가입 | `ProgramApplication`, `Membership` |
| 지원 수락/거절 | 크리에이터의 신청 승인/거절 | `ProgramApplication.status` |
| AI 단가 분석 | AI 가격·혜택·프로그램 구성 추천 | `lib/ai/suggest.ts` |
| 계약 | 프로그램 참여 계약서 / 멤버십 약관 | `Contract` |
| 결제/에스크로 | 팬 선결제 → 플랫폼 보관 → 완료 후 정산 | `Payment`, `Settlement` |
| 리뷰 | 팬 후기 + 상호 평가 | `Review` |
| 알림 | 신청/수락/거절/마감/결제/리뷰 알림 | `Notification` |

### 핵심 역할 반전 (주의)

RFP에서는 **의뢰인이 프로젝트를 등록**하고 프리랜서가 지원한다.
ArtBridge는 **크리에이터가 프로그램을 등록**(`Program.creatorProfileId`)하고
**팬이 신청**(`ProgramApplication.userId = fan`)한다. 결제는 팬(=의뢰인 역할)이 선결제한다.
이 반전 때문에 일부 RFP 흐름(특히 에스크로 완료 승인 주체)과 어긋나는 지점이 발생한다.

---

## 2. 구현 현황 — 기본 필수

| RFP 영역 | 상태 | 비고 |
|---|---|---|
| 이메일 가입/로그인, 비밀번호 해싱 | ✅ 완료 | `auth.ts`, `password.ts` |
| 소셜 로그인 | △ 부분 | Google만 구현, Kakao 없음 (1종이면 충족) |
| Access/Refresh Token 재발급, 로그아웃 무효화 | △ 부분 | Auth.js JWT 암묵 처리. 명시적 Refresh 재발급·서버 토큰 무효화 엔드포인트 없음 |
| 역할별 프로필 | △ 부분 | 크리에이터 프로필에 **기술 스택·경력(년수)·시간당 단가·포트폴리오 URL 필드 부재** |
| 프로젝트 CRUD (3단계 퍼널, soft delete) | ✅ 완료 | `programs.ts`, `Program.deletedAt` |
| 검색/필터/정렬/페이지네이션 | ✅ 완료 | `queries/programs.ts` |
| 지원/수락/거절 + 자동 거절 + 마감 일괄 거절 | ✅ 완료 | `applications.ts` — 트랜잭션·알림 포함 |
| 프로젝트 상태 머신 | △ 부분 | **"모집 예정" 상태 미구현**. enum에 `SCHEDULED` 없음, 생성 즉시 `RECRUITING`, 시작일 도래 자동 전환 로직 없음 |
| 필수 알림 5종 + 헤더 미확인 + 일괄 읽음 | ✅ 완료 | `notifications` + `read-all` |
| 북마크 | △ 부분 | **"작가 북마크"로 구현**(`Bookmark.creatorProfileId`). RFP는 "프로젝트 북마크" — 대상 불일치 |
| 추천 프로젝트 (상세 하단 동일 카테고리) | ❓ 미확인 | 명확한 구현 미확인 — 검증 또는 신규 구현 필요 |

---

## 3. 구현 현황 — 고급 필수

| RFP 영역 | 상태 | 비고 |
|---|---|---|
| AI 단가 분석 + 예산 반영 | △ 부분 | OpenAI+Mock 폴백, 예산 반영 액션 있음. **리포트 구조 상이** — RFP는 "단위 기능별 단가 + 산정 근거 + 총 단가", 현재는 "가격·혜택·주차 구성" |
| 계약서 자동 생성 | ✅ 완료 | `contracts.ts` `getOrCreateContract` |
| 금액 조율 (합의 금액) | ❌ 미구현 | `agreedAmount = program.priceKrw` 고정. 제안↔합의 흐름 없음 |
| 양측 전자 서명 | ❌ 미구현 | **팬 단측 서명만**(`fanSignedAt`). `creatorSignedAt` 필드는 스키마에 존재하나 코드 미사용 |
| PG sandbox 결제 (결제창→콜백→검증) | ❌ 미구현 | **순수 Mock provider만**(`payment/provider.ts`). 실제 sandbox·결제창·콜백 검증 전무 |
| 에스크로 정산 (선결제→완료승인→수수료 10%→지급) | △ 부분 | 정산 자체는 구현. **완료 승인 주체가 크리에이터(수령자)** — RFP는 지불자(팬) 확인. "납품 요청" 단계 없음 |
| 상호 평가 | ❌ 부분 | **팬→프로그램 단방향 리뷰만**. 크리에이터→팬 평가 미구현. `Review`에 방향/피평가자 필드 없음. 평균 별점 노출은 있음 |

---

## 4. 비기능 / 외부 연동

| 항목 | 상태 | 비고 |
|---|---|---|
| 클라우드 스토리지 이미지 업로드 | ❌ 미구현 | 프로필/커버는 URL 입력 필드만, 실제 업로드 파이프라인 없음 |
| `.env.example`, 비밀번호 해싱, 키 환경변수 분리 | ✅ 완료 | |
| 배포 환경 (GitHub 자동 배포) | ✅ 완료 | Vercel 하네스 존재 |
| 도전 과제 (환불, 다회차 협상, 선택 알림 6종, 관리자 정산) | ❌ 미구현 | 전부 미착수 |

---

## 5. 추가 개발 항목 (우선순위)

### P0 — 고급 필수, 평가 직결 (스프린트 3·4 수용 기준)

> SPEC 문서화 완료: **SPEC-011**(금액 조율+양측 서명, 항목 1·4), **SPEC-012**(PG Sandbox, 항목 2), **SPEC-013**(에스크로 완료+상호 평가, 항목 3·5). 상세는 `.moai/specs/SPEC-011~013/spec.md` 및 `.moai/specs/README.md` 참조.

1. **양측 전자 서명 완성** → SPEC-011
   - `creatorSignedAt` 세팅 로직 추가
   - 양측 서명 완료 시에만 결제 가능하도록 `startPayment` 가드 변경
   - 대상: `lib/contracts.ts`, `api/contracts/[id]/sign/route.ts`, 스키마 활용

2. **실제 PG sandbox 연동** → SPEC-012
   - PortOne/Toss 등 sandbox 결제창 + 콜백 검증 라우트 추가
   - 기존 `PaymentProvider` 인터페이스 뒤에 sandbox 어댑터 교체 (비용 낮음)
   - 대상: `lib/payment/provider.ts`, 신규 결제/콜백 라우트

3. **상호 평가 (크리에이터→팬) 양방향화** → SPEC-013
   - `Review`에 방향/피평가자 구분 추가, 양방향 작성·노출
   - 대상: `prisma/schema.prisma`, `lib/reviews.ts`, 리뷰 UI

4. **금액 조율 흐름** → SPEC-011
   - 합의 금액 입력 → 상대 동의/거부 → 계약서 반영 (RFP는 결과만 보장하면 됨)
   - 대상: `lib/contracts.ts`, 신청 처리 흐름

5. **에스크로 완료 승인 주체 재검토** → SPEC-013
   - 지불자(팬) 확인 + "납품 요청" 단계 추가 검토
   - 대상: `lib/reviews.ts` `completeProgram`, 상태 흐름

### P1 — 기본 필수, 매칭 정합성

6. "모집 예정" 상태 + 시작일 도래 자동 전환 (`SCHEDULED` enum 또는 effectiveStatus 확장)
7. 크리에이터 프로필 필드 보강 (기술 스택 / 경력 / 시간당 단가 / 포트폴리오)
8. 추천 프로젝트 섹션 구현 여부 확인 후 보완
9. 클라우드 스토리지 이미지 업로드 파이프라인

### P2 — 선택 / 도전 과제

10. AI 리포트를 "단위 기능별 단가" 구조로 보강
11. Kakao OAuth 추가
12. 도전 과제: 환불 처리, 다회차 협상, 선택 알림 6종, 관리자 정산 관리

---

## 6. 요약

가장 임팩트가 큰 갭은 다음 세 가지이며 모두 스프린트 3·4 수용 기준에 직접 걸린다.

- **양측 전자 서명** (현재 팬 단측만)
- **실제 PG sandbox 결제** (현재 Mock만)
- **상호 평가 양방향** (현재 팬→프로그램 단방향만)

이 중 PG sandbox는 `PaymentProvider` 인터페이스가 이미 잡혀 있어 어댑터 추가만으로
교체 가능하므로 착수 비용이 가장 낮다.
