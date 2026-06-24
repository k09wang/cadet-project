import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentUser: (...a: unknown[]) => mockGetCurrentUser(...a) }));

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    creatorWork: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET, POST } from "@/app/api/creator/works/route";

const CREATOR = { id: "u-1", role: "CREATOR", creatorProfile: { id: "cp-1" } };

function postReq(body: unknown) {
  return new Request("http://localhost/api/creator/works", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockPrisma.creatorWork.findMany.mockReset();
  mockPrisma.creatorWork.create.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("/api/creator/works", () => {
  it("GET은 크리에이터 본인 작업물 목록을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockPrisma.creatorWork.findMany.mockResolvedValue([{ id: "work-1" }]);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(mockPrisma.creatorWork.findMany).toHaveBeenCalledWith({
      where: { creatorProfileId: "cp-1" },
      orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
    });
  });

  it("POST는 검증된 작업물을 생성한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockPrisma.creatorWork.create.mockResolvedValue({ id: "work-1" });

    const res = await POST(postReq({
      title: "전시",
      kind: "개인전",
      imageUrl: "/uploads/creator-assets/cp-1-work.png",
    }));

    expect(res.status).toBe(201);
    expect(mockPrisma.creatorWork.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        creatorProfileId: "cp-1",
        title: "전시",
        kind: "개인전",
        imageUrl: "/uploads/creator-assets/cp-1-work.png",
      }),
    });
  });

  it("POST 검증 실패는 400", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);

    const res = await POST(postReq({ title: "" }));

    expect(res.status).toBe(400);
    expect(mockPrisma.creatorWork.create).not.toHaveBeenCalled();
  });
});
