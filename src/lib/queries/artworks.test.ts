import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    artworkOrder: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    creatorWork: {
      findMany: vi.fn(),
    },
    artwork: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  getArtworkOrderForFan,
  listFanArtworkOrders,
  getArtworkForCheckout,
  listCreatorArtworkOrders,
  listCreatorWorks,
  listCreatorArtworks,
} from "./artworks";

beforeEach(() => {
  mockPrisma.artworkOrder.findFirst.mockReset();
  mockPrisma.artworkOrder.findMany.mockReset();
  mockPrisma.creatorWork.findMany.mockReset();
  mockPrisma.artwork.findFirst.mockReset();
  mockPrisma.artwork.findMany.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("queries/artworks", () => {
  it("getArtworkOrderForFan은 팬 본인 주문만 조회한다", () => {
    mockPrisma.artworkOrder.findFirst.mockReturnValue("order");

    expect(getArtworkOrderForFan("order-1", "fan-1")).toBe("order");

    expect(mockPrisma.artworkOrder.findFirst).toHaveBeenCalledWith({
      where: { id: "order-1", fanUserId: "fan-1" },
      include: expect.objectContaining({
        artwork: expect.any(Object),
        payment: true,
        shipment: true,
        issues: { orderBy: { createdAt: "desc" } },
      }),
    });
  });

  it("listFanArtworkOrders는 팬 본인의 작품 주문을 최신순으로 조회한다", () => {
    mockPrisma.artworkOrder.findMany.mockReturnValue("fan-orders");

    expect(listFanArtworkOrders("fan-1")).toBe("fan-orders");

    const arg = mockPrisma.artworkOrder.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ fanUserId: "fan-1" });
    expect(arg.orderBy).toEqual({ createdAt: "desc" });
    expect(arg.include.artwork).toBeDefined();
    expect(arg.include.payment).toBe(true);
    expect(arg.include.shipment).toBe(true);
    expect(arg.include.issues).toEqual(
      expect.objectContaining({ orderBy: { createdAt: "desc" }, take: 1 }),
    );
  });

  it("getArtworkForCheckout은 공개 재고 작품만 조회한다", () => {
    mockPrisma.artwork.findFirst.mockReturnValue("artwork");

    expect(getArtworkForCheckout("art-1")).toBe("artwork");

    expect(mockPrisma.artwork.findFirst).toHaveBeenCalledWith({
      where: {
        id: "art-1",
        status: "PUBLISHED",
        stock: { gt: 0 },
      },
      include: {
        creatorProfile: { select: { id: true, studioName: true } },
      },
    });
  });

  it("listCreatorArtworkOrders는 크리에이터 소유 작품 주문을 최신순으로 조회한다", () => {
    mockPrisma.artworkOrder.findMany.mockReturnValue("orders");

    expect(listCreatorArtworkOrders("cp-1")).toBe("orders");

    const arg = mockPrisma.artworkOrder.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ artwork: { creatorProfileId: "cp-1" } });
    expect(arg.orderBy).toEqual({ createdAt: "desc" });
    expect(arg.include.fan).toBeDefined();
    expect(arg.include.artwork).toBeDefined();
    expect(arg.include.payment).toBeDefined();
    expect(arg.include.shipment).toBe(true);
    expect(arg.include.issues).toEqual(
      expect.objectContaining({ orderBy: { createdAt: "desc" }, take: 1 }),
    );
  });

  it("listCreatorWorks는 크리에이터 작업물을 기간 최신순으로 조회한다", () => {
    mockPrisma.creatorWork.findMany.mockReturnValue("works");

    expect(listCreatorWorks("cp-1")).toBe("works");

    expect(mockPrisma.creatorWork.findMany).toHaveBeenCalledWith({
      where: { creatorProfileId: "cp-1" },
      orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
    });
  });

  it("listCreatorArtworks는 크리에이터 판매 작품을 최신순으로 조회한다", () => {
    mockPrisma.artwork.findMany.mockReturnValue("artworks");

    expect(listCreatorArtworks("cp-1")).toBe("artworks");

    expect(mockPrisma.artwork.findMany).toHaveBeenCalledWith({
      where: { creatorProfileId: "cp-1" },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });
  });
});
