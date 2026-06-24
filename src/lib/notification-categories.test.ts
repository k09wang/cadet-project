import { describe, expect, it } from "vitest";
import {
  notificationCategory,
  notificationCategoryLabel,
} from "@/lib/notification-categories";

describe("notification-categories", () => {
  it("알림 타입을 주요 카테고리로 매핑한다", () => {
    expect(notificationCategory("MEMBERSHIP_PAYMENT_PAID")).toBe("membership");
    expect(notificationCategory("PROGRAM_PAYMENT_PAID")).toBe("program");
    expect(notificationCategory("APPLICATION_CREATED")).toBe("program");
    expect(notificationCategory("ARTWORK_SHIPPED")).toBe("artwork");
    expect(notificationCategory("SETTLEMENT_ON_HOLD")).toBe("settlement");
    expect(notificationCategory("PAYMENT_COMPLETED")).toBe("general");
  });

  it("카테고리 라벨을 반환한다", () => {
    expect(notificationCategoryLabel("ARTWORK_ORDER_PAID")).toBe("작품");
    expect(notificationCategoryLabel("PAYMENT_COMPLETED")).toBe("일반");
  });
});
