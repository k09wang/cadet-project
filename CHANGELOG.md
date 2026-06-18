# Changelog

본 프로젝트의 주요 변경사항을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르며,
[유의적 버전](https://semver.org/lang/ko/) 0.x(개발 단계)으로 관리됩니다.

## [Unreleased]

### Added — SPEC-007: 커뮤니티 및 멤버 관리

- 커뮤니티 접근 제어 — `canAccessCommunity(userId, creatorProfileId)`(`lib/community-access.ts`) 헬퍼. 다음 중 하나면 `true`: 해당 크리에이터 활성 `Membership` / 결제완료 참여자(`ProgramApplication.status=ACCEPTED` + 연결 `Contract.payments` 중 `PAID`·`RELEASED`) / 소유 크리에이터 본인(FR-001). 권한은 다른 SPEC의 상태에서 파생되며 본 SPEC은 상태를 직접 변경하지 않음(NFR-004).
- 비멤버 격벽 — 비권한 사용자에게 커뮤니티 콘텐츠 숨김 + "멤버십 가입 또는 프로그램 참여 시 열립니다" CTA(`CommunityLockedNotice`)(FR-002/AC-001).
- 커뮤니티 글 CRUD — `GET /api/community-posts?creatorId=`, `POST /api/community-posts`, `PATCH|DELETE /api/community-posts/:id`. 작성은 권한 사용자, 수정·삭제는 작성자 본인 또는 소유 크리에이터(FR-003~007/AC-004,005,010). 비권한·타인 글 조작 시 403.
- 크리에이터 명단 — `/dashboard/creator/members`(활성 `Membership` → 사용자명·플랜·가입일, N+1 회피 `include`)(FR-008/AC-006), `/dashboard/creator/programs/[id]/participants`(`ACCEPTED` 전체 + 결제상태 배지, 미결제는 "결제 대기" 표시)(FR-009/AC-007). 비소유 크리에이터·팬 접근 시 403(FR-010/AC-009).
- 팬 내 멤버십 — `/dashboard/fan/memberships`(활성 멤버십 목록, 크리에이터명·플랜명·가입일)(FR-011/AC-008).
- 컴포넌트 — `CommunityPanel`, `CommunityPostList`, `CommunityPostComposer`, `CommunityLockedNotice`, `MemberList`, `ParticipantList`, `MyMemberships`.
- 쿼리·검증 — `lib/queries/community.ts`, `lib/queries/members.ts`, `lib/validation/community-post.ts`.
- Prisma 마이그레이션 `20260619140000_spec007_community_post` — `CommunityPost` 모델 신규 생성(`content` 필드 사용, SPEC 권장 `body` 대신 실제 스키마 기준) + `(creator_profile_id, created_at)` 인덱스 + `CreatorProfile.communityPosts`·`User.communityPosts` 역관계(FK ON DELETE CASCADE). 추가형이라 기존 데이터 영향 없음.
- 시드 데이터 — 커뮤니티 글 2개(권한 사용자 관점에서 보이도록)(NFR-003).

### Added — SPEC-006: 계약(약관) 및 Mock 결제

- 계약 생성/조회 — `ACCEPTED` 신청 기반 `Contract` 지연 생성(lazy), `terms Json`에 `programTitle`·`priceKrw`·약관 스냅샷 저장, 동일 `applicationId` 재생성 방지.
- 약관 서명 — 팬 본인이 "동의합니다" 체크 후 `PATCH /api/contracts/:id/sign`으로 `fanSignedAt` 설정. 미동의 시 400.
- Mock 결제 — `PaymentProvider` 인터페이스 + `MockPaymentProvider`(`lib/payment/`, 외부 의존 없음, 항상 성공). 서명 완료 후 `POST /api/contracts/:id/payment` 호출 시 단일 `$transaction`으로 `Payment(status=PAID, feeKrw=amount*0.1)` + `Settlement(payout=amount-feeKrw, status=PENDING)` 생성 + `Program.status=IN_PROGRESS` 전환 + `PAYMENT_COMPLETED` 알림.
- 중복 결제 차단 — 동일 계약에 `PAID`/`RELEASED` 결제 존재 시 409.
- 접근 제어 — 팬 본인만 서명/결제 가능(타인 403), 크리에이터(소유자)는 읽기 전용 표시.
- 계약 생성 API — `POST/GET /api/applications/:id/contract`.
- UI — `/contracts/[id]`(약관·금액·`AgreementCheckbox`·`SignButton`·`PayButton`·`PaymentSuccessCard`), `/dashboard/fan/payments`(결제 내역).
- 원화 표시 유틸 `formatKrw` 추가.
- Prisma 마이그레이션 `20260619120000_spec006_contract_payment_align` — 레거시 `contracts.agreed_at` 제거 후 서명 추적 필드(`agreed_amount`, `fan_signed_at`, `creator_signed_at`) 추가, `payments.contract_id` 유니크 인덱스로 1계약 1결제 DB 강제(FR-008/AC-005). 이미 drift된 라이브 DB와 `migrate reset` 양쪽에 안전하도록 멱등 작성.
- 시드 데이터 — `ACCEPTED` 신청 + (선택) 결제 완료 계약을 포함해 수락→결제 흐름 시연 지원(NFR-006).

### Added — SPEC-005: 팬 참여 신청·수락/거절 및 인앱 알림

- 팬의 프로그램 참여 신청 생성 — 중복 신청 차단(409), 자기 참조 금지, 모집 상태(`RECRUITING`)·모집 기한 검증.
- 크리에이터의 신청 수락/거절 — 단일 Prisma `$transaction`으로 상태 변경 + (옵션) 다른 대기 신청 자동 거절(`AUTO_REJECTED`) + 관련 알림 생성을 원자 처리(롤백 보장).
- 인앱 알림 자동 생성 — 신청/수락/거절/자동거절/모집마감 이벤트별 `Notification` 레코드.
- 알림 UI — `/notifications` 목록(미읽음 하이라이트, 클릭 시 읽음 + 링크 이동, 전체 읽음), 헤더 미읽음 배지(`NotificationBell`).
- 크리에이터 신청 관리 페이지 — `/dashboard/creator/programs/[id]/applications`(수락/거절 + 자동 거절 토글).
- REST API — `POST/GET /api/programs/:id/applications`, `PATCH /api/applications/:id`, `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`.
- Prisma 마이그레이션 `20260618232057_add_app_status_and_notif_link` — `ProgramApplicationStatus`에 `AUTO_REJECTED`/`CANCELLED` 추가, `notifications.link_url` 컬럼 추가(init 마이그레이션 누락분 보완).

### Changed

- `Program.updateProgram` — `status`가 `CLOSED`로 전이될 때 모든 `PENDING` 신청자에게 마감 알림 발송(best-effort).
- 시드 데이터 — 미읽음 알림(데모용) 추가.

### Notes

- 타깃 DB에 신규 마이그레이션 적용 필요: `npx prisma migrate deploy`.
