import { beforeEach, describe, expect, it, vi } from "vitest";

// --- vi.hoisted: mock 함수를 hoist ---
const {
  mockMembershipCreate,
  mockMembershipFindFirst,
  mockMembershipPlanFindUnique,
  mockMembershipUpsert,
  mockMembershipUpdate,
  mockNotificationCreate,
  mockPaymentCreate,
  mockSettlementCreate,
} =
  vi.hoisted(() => ({
    mockMembershipCreate: vi.fn(),
    mockMembershipFindFirst: vi.fn(),
    mockMembershipPlanFindUnique: vi.fn(),
    mockMembershipUpsert: vi.fn(),
    mockMembershipUpdate: vi.fn(),
    mockNotificationCreate: vi.fn(),
    mockPaymentCreate: vi.fn(),
    mockSettlementCreate: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    membershipPlan: {
      findUnique: (...args: unknown[]) => mockMembershipPlanFindUnique(...args),
    },
    membership: {
      create: (...args: unknown[]) => mockMembershipCreate(...args),
      findFirst: (...args: unknown[]) => mockMembershipFindFirst(...args),
      upsert: (...args: unknown[]) => mockMembershipUpsert(...args),
      update: (...args: unknown[]) => mockMembershipUpdate(...args),
    },
    payment: {
      create: (...args: unknown[]) => mockPaymentCreate(...args),
    },
    settlement: {
      create: (...args: unknown[]) => mockSettlementCreate(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockNotificationCreate(...args),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
      fn({
        membership: {
          create: (...args: unknown[]) => mockMembershipCreate(...args),
          upsert: (...args: unknown[]) => mockMembershipUpsert(...args),
          update: (...args: unknown[]) => mockMembershipUpdate(...args),
        },
        payment: {
          create: (...args: unknown[]) => mockPaymentCreate(...args),
        },
        settlement: {
          create: (...args: unknown[]) => mockSettlementCreate(...args),
        },
        notification: {
          create: (...args: unknown[]) => mockNotificationCreate(...args),
        },
      }),
    ),
  },
}));

// getCurrentUser mock
const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

const mockPurchaseArtwork = vi.fn();
vi.mock("@/lib/artwork-orders", () => ({
  purchaseArtwork: (...a: unknown[]) => mockPurchaseArtwork(...a),
}));

const { mockCharge } = vi.hoisted(() => ({
  mockCharge: vi.fn(),
}));
vi.mock("@/lib/payment/provider", () => ({
  mockPaymentProvider: {
    name: "mock",
    charge: (...a: unknown[]) => mockCharge(...a),
  },
}));

// next/navigation mock
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  joinMembership,
  purchaseArtworkAction,
} from "@/app/(app)/creators/[creatorId]/actions";
import { redirect } from "next/navigation";

const FAN_USER = { id: "u-fan", role: "FAN", creatorProfile: null };
const PLAN = { priceKrw: 10000, creatorProfileId: "cp-1" };

beforeEach(() => {
  mockMembershipCreate.mockReset();
  mockMembershipFindFirst.mockReset();
  mockMembershipPlanFindUnique.mockReset();
  mockMembershipUpsert.mockReset();
  mockMembershipUpdate.mockReset();
  mockNotificationCreate.mockReset();
  mockPaymentCreate.mockReset();
  mockSettlementCreate.mockReset();
  mockGetCurrentUser.mockReset();
  mockPurchaseArtwork.mockReset();
  mockCharge.mockReset();
  mockCharge.mockResolvedValue({
    success: true,
    provider: "mock",
    providerTxId: "mock-membership-1",
    amount: 10000,
  });
});

describe("joinMembership Server Action (FR-004, FR-005, FR-006, AC-002, AC-003, NFR-003)", () => {
  it("비로그인 시 에러를 던진다", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    await expect(joinMembership("plan-1")).rejects.toThrow();
    expect(mockMembershipCreate).not.toHaveBeenCalled();
  });

  it("팬이 멤버십에 성공적으로 가입하고 Membership을 반환하며 Payment를 생성한다 (FR-004, PRD §8.3)", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    mockMembershipPlanFindUnique.mockResolvedValue(PLAN);
    const created = { id: "m-new", userId: "u-fan", planId: "plan-1", status: "ACTIVE" };
    const updated = { ...created, lastPaymentId: "pay-1" };
    mockMembershipUpsert.mockResolvedValue(created);
    mockPaymentCreate.mockResolvedValue({ id: "pay-1" });
    mockMembershipUpdate.mockResolvedValue(updated);
    mockSettlementCreate.mockResolvedValue({ id: "set-1" });

    const result = await joinMembership("plan-1");
    expect(result).toEqual(updated);
    expect(mockMembershipUpsert).toHaveBeenCalledWith({
      where: { userId_planId: { userId: "u-fan", planId: "plan-1" } },
      update: expect.objectContaining({
        status: "ACTIVE",
        cancelledAt: null,
      }),
      create: expect.objectContaining({
        userId: "u-fan",
        planId: "plan-1",
        status: "ACTIVE",
      }),
    });
    expect(mockPaymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          membershipId: "m-new",
          fanUserId: "u-fan",
          amount: 10000,
          feeKrw: 1000,
          status: "PAID",
          provider: "mock",
          providerTxId: "mock-membership-1",
        }),
      }),
    );
    expect(mockSettlementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        paymentId: "pay-1",
        sourceType: "MEMBERSHIP",
        sourceId: "plan-1",
        grossAmount: 10000,
        feeKrw: 1000,
        payout: 9000,
        status: "PENDING",
      }),
    });
    expect(mockMembershipUpdate).toHaveBeenCalledWith({
      where: { id: "m-new" },
      data: { lastPaymentId: "pay-1" },
    });
  });

  it("이미 가입된 경우에도 upsert로 ACTIVE 상태와 기간을 갱신한다 (FR-005, AC-003, NFR-003)", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    mockMembershipPlanFindUnique.mockResolvedValue(PLAN);
    const existing = { id: "m-existing", userId: "u-fan", planId: "plan-1" };
    const updated = { ...existing, lastPaymentId: "pay-2" };
    mockMembershipUpsert.mockResolvedValue(existing);
    mockPaymentCreate.mockResolvedValue({ id: "pay-2" });
    mockSettlementCreate.mockResolvedValue({ id: "set-2" });
    mockMembershipUpdate.mockResolvedValue(updated);

    const result = await joinMembership("plan-1");
    expect(result).toEqual(updated);
    expect(mockMembershipUpsert).toHaveBeenCalled();
    expect(mockMembershipFindFirst).not.toHaveBeenCalled();
  });

  it("P2002 외 다른 에러는 재던진다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    mockMembershipPlanFindUnique.mockResolvedValue(PLAN);
    const otherError = Object.assign(new Error("DB error"), { code: "P9999" });
    mockMembershipUpsert.mockRejectedValue(otherError);

    await expect(joinMembership("plan-1")).rejects.toThrow("DB error");
  });

  it("결제 실패 시 멤버십 접근 권한 없이 PAYMENT_FAILED/FAILED 상태를 기록한다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    mockMembershipPlanFindUnique.mockResolvedValue(PLAN);
    mockCharge.mockResolvedValue({
      success: false,
      provider: "mock",
      providerTxId: "mock-failed",
      amount: 10000,
    });
    mockMembershipUpsert.mockResolvedValue({
      id: "m-failed",
      userId: "u-fan",
      planId: "plan-1",
      status: "PAYMENT_FAILED",
    });
    mockPaymentCreate.mockResolvedValue({ id: "pay-failed" });

    await expect(joinMembership("plan-1")).rejects.toThrow("Membership payment failed");

    expect(mockMembershipUpsert).toHaveBeenCalledWith({
      where: { userId_planId: { userId: "u-fan", planId: "plan-1" } },
      update: expect.objectContaining({ status: "PAYMENT_FAILED" }),
      create: expect.objectContaining({
        userId: "u-fan",
        planId: "plan-1",
        status: "PAYMENT_FAILED",
      }),
    });
    expect(mockPaymentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        membershipId: "m-failed",
        status: "FAILED",
        providerTxId: "mock-failed",
      }),
    });
    expect(mockSettlementCreate).not.toHaveBeenCalled();
    expect(mockNotificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u-fan",
        type: "MEMBERSHIP_PAYMENT_FAILED",
      }),
    });
  });
});

describe("purchaseArtworkAction", () => {
  it("배송 정보를 받아 작품 구매 서비스로 전달한다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    mockPurchaseArtwork.mockResolvedValue({
      ok: true,
      data: { orderId: "order-1" },
    });
    const formData = new FormData();
    formData.set("recipientName", "홍길동");
    formData.set("recipientPhone", "010-0000-0000");
    formData.set("shippingAddress", "서울시 어딘가");
    formData.set("shippingMemo", "문 앞");

    await purchaseArtworkAction("art-1", formData);

    expect(mockPurchaseArtwork).toHaveBeenCalledWith(
      { userId: "u-fan" },
      {
        artworkId: "art-1",
        recipientName: "홍길동",
        recipientPhone: "010-0000-0000",
        shippingAddress: "서울시 어딘가",
        shippingMemo: "문 앞",
        shippingFeeKrw: 0,
      },
    );
    expect(redirect).toHaveBeenCalledWith("/artwork-orders/order-1");
  });

  it("필수 배송 정보가 없으면 구매 서비스를 호출하지 않는다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    const formData = new FormData();
    formData.set("recipientName", "홍길동");

    await expect(purchaseArtworkAction("art-1", formData)).rejects.toThrow(
      "배송 정보를 입력해 주세요.",
    );
    expect(mockPurchaseArtwork).not.toHaveBeenCalled();
  });
});
