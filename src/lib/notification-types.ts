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
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * 알림 타입에 따른 링크 URL 생성 (NFR-005).
 *
 * 모든 APPLICATION_* 타입과 PROGRAM_CLOSED는 크리에이터 대시보드의
 * 프로그램 신청 목록으로 연결된다.
 */
export function notificationHref(
  type: NotificationType,
  ctx: { programId?: string; applicationId?: string },
): string | null {
  if (!ctx.programId) return null;
  return `/dashboard/creator/programs/${ctx.programId}/applications`;
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
    default:
      // TypeScript에서 exhaustiveness 검사를 위해
      const _exhaustive: never = type;
      return _exhaustive;
  }
}
