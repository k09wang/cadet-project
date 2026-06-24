import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    artwork: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    artworkInventoryReservation: {
      create: vi.fn(),
    },
    artworkOrder: {
      create: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    settlement: {
      create: vi.fn(),
    },
    notification: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const { mockProvider } = vi.hoisted(() => ({
  mockProvider: {
    name: "mock",
    createRequest: vi.fn(),
    charge: vi.fn(),
  },
}));
vi.mock("@/lib/payment/provider", () => ({
  resolvePaymentProvider: () => mockProvider,
}));

import { purchaseArtwork, type ArtworkOrderServiceContext } from "./artwork-orders";

const FAN_CTX: ArtworkOrderServiceContext = { userId: "fan-1" };

function artworkFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "art-1",
    title: "원화",
    status: "PUBLISHED",
    priceKrw: 100000,
    stock: 2,
    creatorProfile: { userId: "creator-user" },
    ...overrides,
  };
}

function orderInput(overrides: Record<string, unknown> = {}) {
  return {
    artworkId: "art-1",
    recipientName: "홍길동",
    recipientPhone: "010-0000-0000",
    shippingAddress: "서울시 어딘가",
    shippingMemo: "문 앞",
    shippingFeeKrw: 3000,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockPrisma));
  mockProvider.createRequest.mockReturnValue({
    merchantUid: "order-art-1",
    amount: 103000,
    productName: "원화",
    provider: "mock",
    paymentParams: {},
  });
  mockProvider.charge.mockResolvedValue({
    success: true,
    provider: "mock",
    providerTxId: "mock-art-1",
    amount: 103000,
  });
});
afterEach(() => vi.clearAllMocks());

describe("purchaseArtwork (SPEC-015 REQ-ART-002~REQ-ART-003)", () => {
  it("작품 결제 성공 시 주문, 결제, 재고 차감, 정산, 알림을 한 트랜잭션으로 처리한다", async () => {
    mockPrisma.artwork.findUnique.mockResolvedValue(artworkFixture());
    mockPrisma.artworkInventoryReservation.create.mockResolvedValue({ id: "res-1" });
    mockPrisma.artworkOrder.create.mockResolvedValue({ id: "order-1", status: "PAID" });
    mockPrisma.artwork.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.payment.create.mockResolvedValue({ id: "pay-1" });
    mockPrisma.settlement.create.mockResolvedValue({ id: "set-1" });

    const result = await purchaseArtwork(FAN_CTX, orderInput());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.orderId).toBe("order-1");
      expect(result.data.paymentId).toBe("pay-1");
      expect(result.data.settlementId).toBe("set-1");
      expect(result.data.amount).toBe(103000);
      expect(result.data.feeKrw).toBe(10300);
    }
    expect(mockPrisma.artwork.updateMany).toHaveBeenCalledWith({
      where: { id: "art-1", stock: { gt: 0 }, status: "PUBLISHED" },
      data: { stock: { decrement: 1 }, status: "PUBLISHED" },
    });
    expect(mockPrisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        artworkOrderId: "order-1",
        fanUserId: "fan-1",
        amount: 103000,
        feeKrw: 10300,
        status: "PAID",
      }),
    });
    expect(mockPrisma.settlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sourceType: "ARTWORK",
        sourceId: "art-1",
        grossAmount: 103000,
        feeKrw: 10300,
        payout: 92700,
      }),
    });
    expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ userId: "fan-1", type: "ARTWORK_ORDER_PAID" }),
        expect.objectContaining({ userId: "creator-user", type: "ARTWORK_ORDER_PAID" }),
      ]),
    });
  });

  it("마지막 재고 구매 시 작품 상태를 SOLD로 바꾼다", async () => {
    mockPrisma.artwork.findUnique.mockResolvedValue(artworkFixture({ stock: 1 }));
    mockPrisma.artworkInventoryReservation.create.mockResolvedValue({ id: "res-1" });
    mockPrisma.artworkOrder.create.mockResolvedValue({ id: "order-1", status: "PAID" });
    mockPrisma.artwork.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.payment.create.mockResolvedValue({ id: "pay-1" });
    mockPrisma.settlement.create.mockResolvedValue({ id: "set-1" });

    await purchaseArtwork(FAN_CTX, orderInput());

    expect(mockPrisma.artwork.updateMany).toHaveBeenCalledWith({
      where: { id: "art-1", stock: { gt: 0 }, status: "PUBLISHED" },
      data: { stock: { decrement: 1 }, status: "SOLD" },
    });
  });

  it("판매 중이 아니거나 재고가 없으면 결제 트랜잭션을 시작하지 않는다", async () => {
    mockPrisma.artwork.findUnique.mockResolvedValue(artworkFixture({ stock: 0 }));

    const result = await purchaseArtwork(FAN_CTX, orderInput());

    expect(result).toEqual({ ok: false, status: 409, error: "Artwork is sold out" });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("작가 본인은 자기 작품을 구매할 수 없다", async () => {
    mockPrisma.artwork.findUnique.mockResolvedValue(
      artworkFixture({ creatorProfile: { userId: "fan-1" } }),
    );

    const result = await purchaseArtwork(FAN_CTX, orderInput());

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "Cannot purchase your own artwork",
    });
  });
});
