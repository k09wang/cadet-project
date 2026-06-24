/**
 * 알림 타입 상수 및 유틸리티 (SPEC-005 NFR-005).
 *
 * 알림 타입에 따른 메시지 생성과 링크 해석을 담당한다.
 */

export const NOTIFICATION_TYPES = [
  "APPLICATION_CREATED",
  "APPLICATION_ACCEPTED",
  "APPLICATION_REJECTED",
  "APPLICATION_AUTO_REJECTED",
  "PROGRAM_CLOSED",
  // SPEC-006 FR-010: 결제 완료 알림
  "PAYMENT_COMPLETED",
  // SPEC-008 FR-002: 완료 승인 후 리뷰 요청 알림
  "REVIEW_REQUESTED",
  // SPEC-011 FR-006/FR-009/FR-020: 금액 조율 + 양측 서명 알림
  "CONTRACT_AMOUNT_PROPOSED",
  "CONTRACT_AMOUNT_REJECTED",
  "CONTRACT_SIGNED",
  // SPEC-013 FR-002/FR-009: 에스크로 완료 + 상호 평가 알림
  "DELIVERY_REQUESTED",
  "COMPLETION_APPROVED",
  "MUTUAL_REVIEW_REQUESTED",
  // SPEC-015: 멤버십/프로그램/작품/정산 확장 알림
  "MEMBERSHIP_PAYMENT_PAID",
  "MEMBERSHIP_PAYMENT_FAILED",
  "MEMBERSHIP_CANCELLED",
  "PROGRAM_SEAT_RESERVED",
  "PROGRAM_PAYMENT_PAID",
  "PROGRAM_PAYMENT_FAILED",
  "PROGRAM_APPLICATION_CANCELLED",
  "PROGRAM_PARTICIPANT_REMOVED",
  "ARTWORK_ORDER_PAID",
  "ARTWORK_SHIPPED",
  "ARTWORK_DELIVERED",
  "ARTWORK_ORDER_RECEIVED",
  "ARTWORK_ORDER_REFUNDED",
  "ARTWORK_ORDER_ISSUE_OPENED",
  "ARTWORK_ORDER_ISSUE_RESOLVED",
  "SETTLEMENT_AVAILABLE",
  "SETTLEMENT_RELEASED",
  "SETTLEMENT_ON_HOLD",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * 크리에이터가 수신하는 알림 타입 (AC-008 접근성 회귀 방지용).
 * 이 타입들만 크리에이터 대시보드(/dashboard/*)로 연결된다.
 * 그 외 APPLICATION_ACCEPTED/REJECTED/AUTO_REJECTED, PROGRAM_CLOSED는
 * 팬에게 전송되므로 팬이 접근 가능한 공개 프로그램 상세로 연결되어야 한다.
 */
const CREATOR_DASHBOARD_TYPES: ReadonlySet<NotificationType> = new Set([
  "APPLICATION_CREATED",
  "PROGRAM_PARTICIPANT_REMOVED",
  "ARTWORK_ORDER_PAID",
  "ARTWORK_ORDER_ISSUE_OPENED",
  "SETTLEMENT_AVAILABLE",
  "SETTLEMENT_RELEASED",
  "SETTLEMENT_ON_HOLD",
  // SPEC-013: 납품 요청은 크리에이터가 보고 팬이 받아 완료 승인하지만,
  // 완료 승인 결과(COMPLETION_APPROVED)는 크리에이터가 받아 참여자 관리에서 확인한다.
  "COMPLETION_APPROVED",
]);

/**
 * 알림 타입에 따른 링크 URL 생성 (NFR-005).
 *
 * 수신자 역할에 따라 링크를 분기한다:
 * - APPLICATION_CREATED (크리에이터 수신) → 크리에이터 대시보드 신청 목록
 * - APPLICATION_ACCEPTED/REJECTED/AUTO_REJECTED, PROGRAM_CLOSED (팬 수신) → 공개 프로그램 상세
 * - PAYMENT_COMPLETED → 계약 결제(SPEC-006)면 계약 확인, 단건 구매(SPEC-009)면 포스트 상세
 * - REVIEW_REQUESTED (팬 수신) → 프로그램 상세에서 리뷰 작성
 * - CONTRACT_* (SPEC-011) → 계약 상세(양측 모두 접근 가능)
 * - DELIVERY_REQUESTED / MUTUAL_REVIEW_REQUESTED (SPEC-013) → 프로그램 상세(에스크로/리뷰)
 * - COMPLETION_APPROVED (크리에이터 수신) → 크리에이터 참여자 관리
 * - SPEC-015 확장 결제/배송/정산 알림 → 각 관리 화면 또는 상세 화면
 */
export function notificationHref(
  type: NotificationType,
  ctx: {
    programId?: string;
    applicationId?: string;
    contractId?: string;
    membershipId?: string;
    postId?: string;
    artworkOrderId?: string;
    settlementId?: string;
  },
): string | null {
  // SPEC-011: 계약 관련 알림은 양측 모두 접근 가능한 계약 상세로 연결
  if (
    type === "CONTRACT_AMOUNT_PROPOSED" ||
    type === "CONTRACT_AMOUNT_REJECTED" ||
    type === "CONTRACT_SIGNED"
  ) {
    return ctx.contractId ? `/contracts/${ctx.contractId}` : null;
  }
  if (type === "PAYMENT_COMPLETED") {
    // SPEC-009: 단건 포스트 구매는 포스트 상세로 연결한다.
    if (ctx.postId) return `/posts/${ctx.postId}`;
    return ctx.contractId ? `/contracts/${ctx.contractId}` : null;
  }
  if (
    type === "MEMBERSHIP_PAYMENT_PAID" ||
    type === "MEMBERSHIP_PAYMENT_FAILED" ||
    type === "MEMBERSHIP_CANCELLED"
  ) {
    return ctx.membershipId ? "/dashboard/fan/memberships" : null;
  }
  if (
    type === "ARTWORK_ORDER_PAID" ||
    type === "ARTWORK_SHIPPED" ||
    type === "ARTWORK_DELIVERED" ||
    type === "ARTWORK_ORDER_RECEIVED" ||
    type === "ARTWORK_ORDER_REFUNDED" ||
    type === "ARTWORK_ORDER_ISSUE_RESOLVED" ||
    type === "ARTWORK_ORDER_ISSUE_OPENED"
  ) {
    return ctx.artworkOrderId ? `/artwork-orders/${ctx.artworkOrderId}` : null;
  }
  if (
    type === "SETTLEMENT_AVAILABLE" ||
    type === "SETTLEMENT_RELEASED" ||
    type === "SETTLEMENT_ON_HOLD"
  ) {
    return ctx.settlementId
      ? `/dashboard/creator/settlements/${ctx.settlementId}`
      : null;
  }
  if (
    type === "REVIEW_REQUESTED" ||
    type === "DELIVERY_REQUESTED" ||
    type === "MUTUAL_REVIEW_REQUESTED"
  ) {
    // SPEC-008/013: 리뷰·에스크로 흐름은 프로그램 상세에서 진행한다.
    return ctx.programId ? `/programs/${ctx.programId}` : null;
  }
  if (type === "COMPLETION_APPROVED" && ctx.programId) {
    return `/dashboard/creator/programs/${ctx.programId}/applications`;
  }
  if (!ctx.programId) return null;
  if (CREATOR_DASHBOARD_TYPES.has(type)) {
    return `/dashboard/creator/programs/${ctx.programId}/applications`;
  }
  // 팬 수신 알림: proxy(/dashboard/* 보호)를 통과하는 공개 라우트로 연결 (AC-008).
  return `/programs/${ctx.programId}`;
}

/**
 * 알림 타입에 따른 한국어 메시지 생성 (NFR-005).
 */
export function buildNotificationMessage(
  type: NotificationType,
  _ctx: Record<string, unknown>,
): string {
  switch (type) {
    case "APPLICATION_CREATED":
      return "새로운 신청이 도착했습니다.";
    case "APPLICATION_ACCEPTED":
      return "신청이 수락되었습니다.";
    case "APPLICATION_REJECTED":
      return "신청이 거절되었습니다.";
    case "APPLICATION_AUTO_REJECTED":
      return "다른 참여자가 선택되어 자동으로 거절되었습니다.";
    case "PROGRAM_CLOSED":
      return "프로그램 모집이 마감되었습니다.";
    case "PAYMENT_COMPLETED":
      return "결제가 완료되었습니다.";
    case "REVIEW_REQUESTED":
      return "프로그램이 완료되었습니다. 리뷰를 작성해 보세요.";
    case "CONTRACT_AMOUNT_PROPOSED":
      return "크리에이터가 합의 금액을 제시했습니다. 확인해 보세요.";
    case "CONTRACT_AMOUNT_REJECTED":
      return "팬이 제시된 금액에 동의하지 않아 계약이 취소되었습니다.";
    case "CONTRACT_SIGNED":
      return "양측 서명이 완료되어 결제를 진행할 수 있습니다.";
    case "DELIVERY_REQUESTED":
      return "크리에이터가 납품 요청을 보냈습니다. 완료 승인 후 정산이 진행됩니다.";
    case "COMPLETION_APPROVED":
      return "팬이 완료를 승인했습니다. 정산이 릴리스됩니다.";
    case "MUTUAL_REVIEW_REQUESTED":
      return "거래가 완료되었습니다. 상호 평가를 작성해 보세요.";
    case "MEMBERSHIP_PAYMENT_PAID":
      return "멤버십 결제가 완료되었습니다.";
    case "MEMBERSHIP_PAYMENT_FAILED":
      return "멤버십 결제에 실패했습니다. 결제 수단을 확인해 주세요.";
    case "MEMBERSHIP_CANCELLED":
      return "멤버십이 취소되었습니다.";
    case "PROGRAM_SEAT_RESERVED":
      return "프로그램 자리가 예약되었습니다. 제한 시간 안에 결제를 완료해 주세요.";
    case "PROGRAM_PAYMENT_PAID":
      return "프로그램 결제가 완료되어 참여가 확정되었습니다.";
    case "PROGRAM_PAYMENT_FAILED":
      return "프로그램 결제에 실패해 자리 예약이 해제되었습니다.";
    case "PROGRAM_APPLICATION_CANCELLED":
      return "프로그램 신청이 취소되었습니다.";
    case "PROGRAM_PARTICIPANT_REMOVED":
      return "프로그램 참여 멤버가 제외되었습니다.";
    case "ARTWORK_ORDER_PAID":
      return "작품 주문 결제가 완료되었습니다.";
    case "ARTWORK_SHIPPED":
      return "작품이 발송되었습니다.";
    case "ARTWORK_DELIVERED":
      return "작품 배송이 완료되었습니다. 수령 상태를 확인해 주세요.";
    case "ARTWORK_ORDER_RECEIVED":
      return "작품 수령이 확인되었습니다.";
    case "ARTWORK_ORDER_REFUNDED":
      return "작품 주문이 환불 처리되었습니다.";
    case "ARTWORK_ORDER_ISSUE_OPENED":
      return "작품 주문 문제가 접수되었습니다.";
    case "ARTWORK_ORDER_ISSUE_RESOLVED":
      return "작품 주문 문제가 해결되었습니다.";
    case "SETTLEMENT_AVAILABLE":
      return "정산 가능한 금액이 생겼습니다.";
    case "SETTLEMENT_RELEASED":
      return "정산이 완료되었습니다.";
    case "SETTLEMENT_ON_HOLD":
      return "정산이 보류되었습니다. 사유를 확인해 주세요.";
    default:
      // TypeScript에서 exhaustiveness 검사를 위해
      const _exhaustive: never = type;
      return _exhaustive;
  }
}
