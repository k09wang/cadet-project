# SPEC-016 Progress

- Started: 2026-06-23
- Phase 0.1 complete: `ArtBridge_유저플로우_확장안_2026-06-23.md`의 남은 보완 후보를 기준으로 팬/크리에이터/미인증 GNB 이후 갭 정리.
- Phase 0.2 complete: 현재 라우트 목록에서 `/dashboard/fan/artwork-orders`, `/dashboard/creator/payout-settings`, checkout 전용 화면, 알림 설정 화면이 아직 별도 route로 없음을 확인.
- Phase 0.3 complete: `Header.tsx`, SPEC-015 progress, `prisma/schema.prisma`, 작품 주문/정산 관련 코드 검색을 통해 이미 존재하는 기능과 재사용 가능한 모델을 확인.
- Phase 1 complete: 공개 모바일 GNB를 추가하고, 팬 `내 활동` 페이지에 활동 허브를 얹었으며, 팬 작품 주문 목록(`/dashboard/fan/artwork-orders`)과 본인 주문 조회 쿼리를 추가.
- Phase 2 complete: `CreatorPayoutAccount` 모델/마이그레이션, 정산 설정 저장 서비스, 정산 설정 화면(`/dashboard/creator/payout-settings`), 정산 관리 화면의 설정 진입점을 추가.
- Phase 3 complete: 작품 checkout(`/artworks/[id]/checkout`), 프로그램 checkout(`/programs/[id]/checkout`), 멤버십 checkout(`/creators/[creatorId]/memberships/[planId]/checkout`) 전용 확인 화면을 추가하고 기존 CTA를 각 checkout route로 연결.
- Phase 4 complete: 프로그램 상세/checkout에 기본 FAQ와 참여 전 안내를 추가하고, 알림 화면에 전체/멤버십/프로그램/작품/정산 카테고리 필터와 카테고리 라벨을 추가.
- Phase 1 validation complete: Header/작품 주문 쿼리 테스트 8개, TypeScript `tsc --noEmit`, 변경 파일 ESLint 통과.
- Phase 2 validation complete: 정산 설정 서비스 테스트 3개 포함 타깃 테스트 11개, Prisma validate/generate, TypeScript `tsc --noEmit`, 변경 TS/TSX 파일 ESLint 통과.
- Phase 3 validation complete: checkout 관련 컴포넌트/쿼리 테스트 40개, TypeScript `tsc --noEmit`, 변경 TS/TSX 파일 ESLint 통과.
- Phase 4 validation complete: FAQ/알림 필터 테스트 16개, TypeScript `tsc --noEmit`, 변경 TS/TSX 파일 ESLint 통과.
