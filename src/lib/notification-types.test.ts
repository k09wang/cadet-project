import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_TYPES,
  notificationHref,
  buildNotificationMessage,
  type NotificationType,
} from "./notification-types";

describe("notification-types (NFR-005)", () => {
  describe("NOTIFICATION_TYPES", () => {
    it("필수 타입을 모두 포함한다", () => {
      expect(NOTIFICATION_TYPES).toContain("APPLICATION_CREATED");
      expect(NOTIFICATION_TYPES).toContain("APPLICATION_ACCEPTED");
      expect(NOTIFICATION_TYPES).toContain("APPLICATION_REJECTED");
      expect(NOTIFICATION_TYPES).toContain("APPLICATION_AUTO_REJECTED");
      expect(NOTIFICATION_TYPES).toContain("PROGRAM_CLOSED");
      expect(NOTIFICATION_TYPES).toContain("PAYMENT_COMPLETED");
      // SPEC-008 FR-002
      expect(NOTIFICATION_TYPES).toContain("REVIEW_REQUESTED");
      // SPEC-015
      expect(NOTIFICATION_TYPES).toContain("MEMBERSHIP_PAYMENT_PAID");
      expect(NOTIFICATION_TYPES).toContain("PROGRAM_SEAT_RESERVED");
      expect(NOTIFICATION_TYPES).toContain("ARTWORK_ORDER_PAID");
      expect(NOTIFICATION_TYPES).toContain("SETTLEMENT_AVAILABLE");
    });
  });

  describe("notificationHref", () => {
    it("APPLICATION_CREATED는 크리에이터 대시보드 신청 목록으로 연결", () => {
      const result = notificationHref("APPLICATION_CREATED", {
        programId: "prog-1",
      });
      expect(result).toBe("/dashboard/creator/programs/prog-1/applications");
    });

    it("APPLICATION_ACCEPTED는 팬이 접근 가능한 프로그램 상세로 연결 (AC-008)", () => {
      const result = notificationHref("APPLICATION_ACCEPTED", {
        programId: "prog-1",
      });
      expect(result).toBe("/programs/prog-1");
    });

    it("APPLICATION_REJECTED는 팬이 접근 가능한 프로그램 상세로 연결 (AC-008)", () => {
      const result = notificationHref("APPLICATION_REJECTED", {
        programId: "prog-1",
      });
      expect(result).toBe("/programs/prog-1");
    });

    it("APPLICATION_AUTO_REJECTED는 팬이 접근 가능한 프로그램 상세로 연결 (AC-008)", () => {
      const result = notificationHref("APPLICATION_AUTO_REJECTED", {
        programId: "prog-1",
      });
      expect(result).toBe("/programs/prog-1");
    });

    it("PROGRAM_CLOSED는 팬이 접근 가능한 프로그램 상세로 연결 (AC-008)", () => {
      const result = notificationHref("PROGRAM_CLOSED", {
        programId: "prog-1",
      });
      expect(result).toBe("/programs/prog-1");
    });

    // 회귀 방지: 팬이 수신하는 알림 링크는 /dashboard/* 로 시작해선 안 된다
    // (proxy가 /dashboard를 보호하므로 팬은 로그인 페이지로 튕김).
    it("팬 수신 알림은 보호 라우트(/dashboard)로 시작하지 않는다 (AC-008 접근성 회귀 방지)", () => {
      const fanAudienceTypes: NotificationType[] = [
        "APPLICATION_ACCEPTED",
        "APPLICATION_REJECTED",
        "APPLICATION_AUTO_REJECTED",
        "PROGRAM_CLOSED",
        "REVIEW_REQUESTED",
      ];
      for (const type of fanAudienceTypes) {
        const result = notificationHref(type, { programId: "prog-1" });
        expect(result, `${type} should not point to /dashboard`).not.toMatch(
          /^\/dashboard/,
        );
      }
    });

    it("PAYMENT_COMPLETED는 계약 확인 페이지로 연결 (SPEC-006 FR-010)", () => {
      const result = notificationHref("PAYMENT_COMPLETED", {
        contractId: "contract-1",
      });
      expect(result).toBe("/contracts/contract-1");
    });

    it("PAYMENT_COMPLETED는 postId가 있으면 포스트 상세로 연결 (SPEC-009)", () => {
      const result = notificationHref("PAYMENT_COMPLETED", { postId: "post-3" });
      expect(result).toBe("/posts/post-3");
    });

    it("PAYMENT_COMPLETED는 postId가 contractId보다 우선한다 (SPEC-009)", () => {
      const result = notificationHref("PAYMENT_COMPLETED", {
        postId: "post-3",
        contractId: "contract-1",
      });
      expect(result).toBe("/posts/post-3");
    });

    it("PAYMENT_COMPLETED는 contractId/postId가 없으면 null", () => {
      expect(notificationHref("PAYMENT_COMPLETED", {})).toBeNull();
    });

    it("멤버십 결제 알림은 팬 멤버십 관리로 연결", () => {
      const result = notificationHref("MEMBERSHIP_PAYMENT_PAID", {
        membershipId: "membership-1",
      });
      expect(result).toBe("/dashboard/fan/memberships");
    });

    it("프로그램 결제 알림은 프로그램 상세로 연결", () => {
      const result = notificationHref("PROGRAM_PAYMENT_PAID", { programId: "prog-1" });
      expect(result).toBe("/programs/prog-1");
    });

    it("작품 주문 알림은 작품 주문 상세로 연결", () => {
      const result = notificationHref("ARTWORK_ORDER_PAID", {
        artworkOrderId: "order-1",
      });
      expect(result).toBe("/artwork-orders/order-1");
    });

    it("정산 알림은 크리에이터 정산 화면으로 연결", () => {
      const result = notificationHref("SETTLEMENT_AVAILABLE", {
        settlementId: "settlement-1",
      });
      expect(result).toBe("/dashboard/creator/settlements/settlement-1");
    });

    it("REVIEW_REQUESTED는 프로그램 상세로 연결 (SPEC-008 FR-011)", () => {
      const result = notificationHref("REVIEW_REQUESTED", { programId: "prog-1" });
      expect(result).toBe("/programs/prog-1");
    });

    it("REVIEW_REQUESTED는 programId가 없으면 null", () => {
      expect(notificationHref("REVIEW_REQUESTED", {})).toBeNull();
    });

    it("programId가 없으면 null을 반환", () => {
      const result = notificationHref("APPLICATION_CREATED", {});
      expect(result).toBeNull();
    });

    it("모든 타입에 대해 programId 없으면 null", () => {
      NOTIFICATION_TYPES.forEach((type) => {
        const result = notificationHref(type as NotificationType, {});
        expect(result).toBeNull();
      });
    });
  });

  describe("buildNotificationMessage", () => {
    it("APPLICATION_CREATED 메시지 생성", () => {
      const result = buildNotificationMessage("APPLICATION_CREATED", {});
      expect(result).toBe("새로운 신청이 도착했습니다.");
    });

    it("APPLICATION_ACCEPTED 메시지 생성", () => {
      const result = buildNotificationMessage("APPLICATION_ACCEPTED", {});
      expect(result).toBe("신청이 수락되었습니다.");
    });

    it("APPLICATION_REJECTED 메시지 생성", () => {
      const result = buildNotificationMessage("APPLICATION_REJECTED", {});
      expect(result).toBe("신청이 거절되었습니다.");
    });

    it("APPLICATION_AUTO_REJECTED 메시지 생성", () => {
      const result = buildNotificationMessage("APPLICATION_AUTO_REJECTED", {});
      expect(result).toBe("다른 참여자가 선택되어 자동으로 거절되었습니다.");
    });

    it("PROGRAM_CLOSED 메시지 생성", () => {
      const result = buildNotificationMessage("PROGRAM_CLOSED", {});
      expect(result).toBe("프로그램 모집이 마감되었습니다.");
    });

    it("PAYMENT_COMPLETED 메시지 생성 (SPEC-006 FR-010)", () => {
      const result = buildNotificationMessage("PAYMENT_COMPLETED", {});
      expect(result).toBe("결제가 완료되었습니다.");
    });

    it("REVIEW_REQUESTED 메시지 생성 (SPEC-008 FR-002)", () => {
      const result = buildNotificationMessage("REVIEW_REQUESTED", {});
      expect(result).toBe("프로그램이 완료되었습니다. 리뷰를 작성해 보세요.");
    });

    it("SPEC-015 멤버십/작품/정산 메시지 생성", () => {
      expect(buildNotificationMessage("MEMBERSHIP_PAYMENT_PAID", {})).toBe(
        "멤버십 결제가 완료되었습니다.",
      );
      expect(buildNotificationMessage("ARTWORK_SHIPPED", {})).toBe(
        "작품이 발송되었습니다.",
      );
      expect(buildNotificationMessage("SETTLEMENT_ON_HOLD", {})).toBe(
        "정산이 보류되었습니다. 사유를 확인해 주세요.",
      );
    });
  });
});
