import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentUser: (...a: unknown[]) => mockGetCurrentUser(...a) }));

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    artwork: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    artworkOrder: {
      count: vi.fn(),
    },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { DELETE, PATCH } from "@/app/api/creator/artworks/[id]/route";

const CREATOR = { id: "u-1", role: "CREATOR", creatorProfile: { id: "cp-1" } };
const FAN = { id: "fan-1", role: "FAN", creatorProfile: null };
const OTHER_CREATOR = { id: "u-2", role: "CREATOR", creatorProfile: { id: "cp-2" } };
const ARTWORK = { id: "art-1", creatorProfileId: "cp-1" };

function ctx(id = "art-1") {
  return { params: Promise.resolve({ id }) };
}

function patchReq(body: unknown) {
  return new Request("http://localhost/api/creator/artworks/art-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockPrisma.artwork.findUnique.mockReset();
  mockPrisma.artwork.update.mockReset();
  mockPrisma.artwork.delete.mockReset();
  mockPrisma.artworkOrder.count.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("/api/creator/artworks/[id]", () => {
  it("PATCH는 팬 요청에 403을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN);

    const res = await PATCH(patchReq({ title: "수정" }), ctx());

    expect(res.status).toBe(403);
  });

  it("PATCH는 본인 판매 작품을 수정한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockPrisma.artwork.findUnique.mockResolvedValue(ARTWORK);
    mockPrisma.artwork.update.mockResolvedValue({ ...ARTWORK, title: "수정" });

    const res = await PATCH(
      patchReq({ title: "수정", priceKrw: 120000, stock: 3, status: "PUBLISHED" }),
      ctx(),
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.artwork.update).toHaveBeenCalledWith({
      where: { id: "art-1" },
      data: expect.objectContaining({
        title: "수정",
        priceKrw: 120000,
        stock: 3,
        status: "PUBLISHED",
      }),
    });
  });

  it("PATCH 검증 실패는 400을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);

    const res = await PATCH(patchReq({ priceKrw: 0 }), ctx());

    expect(res.status).toBe(400);
    expect(mockPrisma.artwork.findUnique).not.toHaveBeenCalled();
  });

  it("PATCH는 타 크리에이터 판매 작품에 403을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(OTHER_CREATOR);
    mockPrisma.artwork.findUnique.mockResolvedValue(ARTWORK);

    const res = await PATCH(patchReq({ title: "수정" }), ctx());

    expect(res.status).toBe(403);
    expect(mockPrisma.artwork.update).not.toHaveBeenCalled();
  });

  it("DELETE는 주문이 없는 본인 판매 작품을 삭제한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockPrisma.artwork.findUnique.mockResolvedValue(ARTWORK);
    mockPrisma.artworkOrder.count.mockResolvedValue(0);
    mockPrisma.artwork.delete.mockResolvedValue(ARTWORK);

    const res = await DELETE(new Request("http://localhost/api/creator/artworks/art-1"), ctx());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockPrisma.artwork.delete).toHaveBeenCalledWith({ where: { id: "art-1" } });
  });

  it("DELETE는 주문 이력이 있으면 숨김 처리한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockPrisma.artwork.findUnique.mockResolvedValue(ARTWORK);
    mockPrisma.artworkOrder.count.mockResolvedValue(1);
    mockPrisma.artwork.update.mockResolvedValue({ ...ARTWORK, status: "HIDDEN" });

    const res = await DELETE(new Request("http://localhost/api/creator/artworks/art-1"), ctx());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hidden).toBe(true);
    expect(mockPrisma.artwork.delete).not.toHaveBeenCalled();
    expect(mockPrisma.artwork.update).toHaveBeenCalledWith({
      where: { id: "art-1" },
      data: { status: "HIDDEN" },
    });
  });
});
