import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    artworkOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    artworkShipment: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    artworkOrderIssue: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    payment: {
      update: vi.fn(),
    },
    artwork: {
      update: vi.fn(),
    },
    settlement: {
      update: vi.fn(),
    },
    settlementAdjustment: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  markArtworkOrderReceived,
  refundArtworkOrder,
  reportArtworkOrderIssue,
  resolveArtworkOrderIssue,
  shipArtworkOrder,
  type ArtworkFulfillmentContext,
} from "./artwork-fulfillment";

const CREATOR_CTX: ArtworkFulfillmentContext = {
  userId: "creator-user",
  role: "CREATOR",
  creatorProfileId: "cp-1",
};
const FAN_CTX: ArtworkFulfillmentContext = {
  userId: "fan-1",
  role: "FAN",
  creatorProfileId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockPrisma));
});
afterEach(() => vi.clearAllMocks());

describe("artwork fulfillment (SPEC-015 REQ-ART-004~REQ-ART-005)", () => {
  it("크리에이터가 결제 완료 주문을 발송 처리하면 Shipment와 SHIPPED 상태, 팬 알림을 생성한다", async () => {
    mockPrisma.artworkOrder.findUnique.mockResolvedValue({
      id: "order-1",
      fanUserId: "fan-1",
      status: "PAID",
      artwork: { creatorProfileId: "cp-1" },
    });
    mockPrisma.artworkShipment.upsert.mockResolvedValue({ id: "ship-1" });
    mockPrisma.artworkOrder.update.mockResolvedValue({ id: "order-1", status: "SHIPPED" });

    const result = await shipArtworkOrder(CREATOR_CTX, "order-1", {
      carrier: "CJ대한통운",
      trackingNo: "123456",
    });

    expect(result.ok).toBe(true);
    expect(mockPrisma.artworkShipment.upsert).toHaveBeenCalledWith({
      where: { orderId: "order-1" },
      create: expect.objectContaining({
        orderId: "order-1",
        carrier: "CJ대한통운",
        trackingNo: "123456",
      }),
      update: expect.objectContaining({
        carrier: "CJ대한통운",
        trackingNo: "123456",
      }),
    });
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "fan-1",
        type: "ARTWORK_SHIPPED",
      }),
    });
  });

  it("작품 소유자가 아닌 크리에이터는 발송 처리할 수 없다", async () => {
    mockPrisma.artworkOrder.findUnique.mockResolvedValue({
      id: "order-1",
      fanUserId: "fan-1",
      status: "PAID",
      artwork: { creatorProfileId: "cp-other" },
    });

    const result = await shipArtworkOrder(CREATOR_CTX, "order-1", {
      carrier: "CJ대한통운",
      trackingNo: "123456",
    });

    expect(result).toEqual({ ok: false, status: 403, error: "Forbidden: not the artwork owner" });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("팬이 문제 신고를 하면 이슈 생성, 주문 ISSUE_OPENED, 정산 ON_HOLD, 크리에이터 알림을 처리한다", async () => {
    mockPrisma.artworkOrder.findUnique.mockResolvedValue({
      id: "order-1",
      fanUserId: "fan-1",
      status: "SHIPPED",
      artwork: { creatorProfile: { userId: "creator-user" } },
      payment: { settlement: { id: "set-1" } },
    });
    mockPrisma.artworkOrderIssue.create.mockResolvedValue({ id: "issue-1" });
    mockPrisma.artworkOrder.update.mockResolvedValue({ id: "order-1", status: "ISSUE_OPENED" });

    const result = await reportArtworkOrderIssue(FAN_CTX, "order-1", {
      type: "DAMAGED",
      message: "작품이 파손되어 도착했습니다.",
    });

    expect(result.ok).toBe(true);
    expect(mockPrisma.artworkOrderIssue.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "order-1",
        userId: "fan-1",
        type: "DAMAGED",
      }),
    });
    expect(mockPrisma.settlement.update).toHaveBeenCalledWith({
      where: { id: "set-1" },
      data: expect.objectContaining({
        status: "ON_HOLD",
        heldReason: "Artwork issue: DAMAGED",
      }),
    });
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "creator-user",
        type: "ARTWORK_ORDER_ISSUE_OPENED",
      }),
    });
  });

  it("구매자가 아닌 사용자는 문제 신고를 할 수 없다", async () => {
    mockPrisma.artworkOrder.findUnique.mockResolvedValue({
      id: "order-1",
      fanUserId: "other-fan",
      status: "SHIPPED",
      artwork: { creatorProfile: { userId: "creator-user" } },
      payment: null,
    });

    const result = await reportArtworkOrderIssue(FAN_CTX, "order-1", {
      type: "OTHER",
      message: "문의",
    });

    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "Forbidden: only the buyer can report an issue",
    });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("팬이 수령 완료하면 주문 RECEIVED와 정산 AVAILABLE, 크리에이터 알림을 처리한다", async () => {
    mockPrisma.artworkOrder.findUnique.mockResolvedValue({
      id: "order-1",
      fanUserId: "fan-1",
      status: "SHIPPED",
      shipment: { deliveredAt: null },
      artwork: { creatorProfile: { userId: "creator-user" } },
      payment: { settlement: { id: "set-1", status: "PENDING", availableAt: null } },
    });
    mockPrisma.artworkOrder.update.mockResolvedValue({ id: "order-1", status: "RECEIVED" });
    mockPrisma.settlement.update.mockResolvedValue({ id: "set-1", status: "AVAILABLE" });

    const result = await markArtworkOrderReceived(FAN_CTX, "order-1");

    expect(result.ok).toBe(true);
    expect(mockPrisma.artworkOrder.update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: expect.objectContaining({ status: "RECEIVED" }),
    });
    expect(mockPrisma.settlement.update).toHaveBeenCalledWith({
      where: { id: "set-1" },
      data: expect.objectContaining({ status: "AVAILABLE", heldReason: null }),
    });
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "creator-user", type: "ARTWORK_ORDER_RECEIVED" }),
    });
  });

  it("크리에이터가 환불 처리하면 주문/결제/정산을 환불 상태로 정리한다", async () => {
    mockPrisma.artworkOrder.findUnique.mockResolvedValue({
      id: "order-1",
      artworkId: "art-1",
      fanUserId: "fan-1",
      status: "PAID",
      artwork: { creatorProfileId: "cp-1", creatorProfile: { userId: "creator-user" } },
      payment: { id: "pay-1", settlement: { id: "set-1", payout: 90000 } },
    });
    mockPrisma.artworkOrder.update.mockResolvedValue({ id: "order-1", status: "REFUNDED" });
    mockPrisma.payment.update.mockResolvedValue({ id: "pay-1", status: "REFUNDED" });
    mockPrisma.settlement.update.mockResolvedValue({ id: "set-1", status: "ADJUSTED" });

    const result = await refundArtworkOrder(CREATOR_CTX, "order-1", { reason: "파손 환불" });

    expect(result.ok).toBe(true);
    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: "pay-1" },
      data: { status: "REFUNDED" },
    });
    expect(mockPrisma.settlement.update).toHaveBeenCalledWith({
      where: { id: "set-1" },
      data: expect.objectContaining({ status: "ADJUSTED", payout: 0 }),
    });
    expect(mockPrisma.settlementAdjustment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        settlementId: "set-1",
        type: "REFUND_DEDUCTION",
        amount: -90000,
      }),
    });
    expect(mockPrisma.artwork.update).toHaveBeenCalledWith({
      where: { id: "art-1" },
      data: { stock: { increment: 1 }, status: "PUBLISHED" },
    });
  });

  it("크리에이터가 이슈를 해결하면 열린 이슈를 닫고 정산을 AVAILABLE로 전환한다", async () => {
    mockPrisma.artworkOrder.findUnique.mockResolvedValue({
      id: "order-1",
      fanUserId: "fan-1",
      status: "ISSUE_OPENED",
      artwork: { creatorProfileId: "cp-1" },
      payment: { settlement: { id: "set-1", status: "ON_HOLD", availableAt: null } },
      issues: [{ id: "issue-1" }],
    });
    mockPrisma.artworkOrderIssue.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.artworkOrder.update.mockResolvedValue({ id: "order-1", status: "RECEIVED" });
    mockPrisma.settlement.update.mockResolvedValue({ id: "set-1", status: "AVAILABLE" });

    const result = await resolveArtworkOrderIssue(CREATOR_CTX, "order-1", {
      resolutionNote: "재발송 완료",
    });

    expect(result.ok).toBe(true);
    expect(mockPrisma.artworkOrderIssue.updateMany).toHaveBeenCalledWith({
      where: { orderId: "order-1", status: { in: ["OPEN", "REVIEWING"] } },
      data: { status: "RESOLVED" },
    });
    expect(mockPrisma.settlement.update).toHaveBeenCalledWith({
      where: { id: "set-1" },
      data: expect.objectContaining({ status: "AVAILABLE", heldReason: null }),
    });
  });
});
