import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentUser: (...a: unknown[]) => mockGetCurrentUser(...a) }));

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    artwork: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET, POST } from "@/app/api/creator/artworks/route";

const CREATOR = { id: "u-1", role: "CREATOR", creatorProfile: { id: "cp-1" } };

function postReq(body: unknown) {
  return new Request("http://localhost/api/creator/artworks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockPrisma.artwork.findMany.mockReset();
  mockPrisma.artwork.create.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("/api/creator/artworks", () => {
  it("GET은 크리에이터 본인 작품 목록을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockPrisma.artwork.findMany.mockResolvedValue([{ id: "art-1" }]);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(mockPrisma.artwork.findMany).toHaveBeenCalledWith({
      where: { creatorProfileId: "cp-1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("POST는 검증된 판매 작품을 생성한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockPrisma.artwork.create.mockResolvedValue({ id: "art-1" });

    const res = await POST(postReq({
      title: "원화",
      imageUrl: "/uploads/creator-assets/cp-1-art.png",
      priceKrw: 100000,
      stock: 1,
      status: "PUBLISHED",
    }));

    expect(res.status).toBe(201);
    expect(mockPrisma.artwork.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        creatorProfileId: "cp-1",
        title: "원화",
        imageUrl: "/uploads/creator-assets/cp-1-art.png",
        priceKrw: 100000,
        stock: 1,
        status: "PUBLISHED",
      }),
    });
  });

  it("가격이 0원이면 400", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);

    const res = await POST(postReq({ title: "원화", priceKrw: 0 }));

    expect(res.status).toBe(400);
    expect(mockPrisma.artwork.create).not.toHaveBeenCalled();
  });
});
