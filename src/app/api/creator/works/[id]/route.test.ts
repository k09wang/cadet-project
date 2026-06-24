import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentUser: (...a: unknown[]) => mockGetCurrentUser(...a) }));

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    creatorWork: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { DELETE, PATCH } from "@/app/api/creator/works/[id]/route";

const CREATOR = { id: "u-1", role: "CREATOR", creatorProfile: { id: "cp-1" } };
const OTHER_CREATOR = { id: "u-2", role: "CREATOR", creatorProfile: { id: "cp-2" } };
const WORK = { id: "work-1", creatorProfileId: "cp-1" };

function ctx(id = "work-1") {
  return { params: Promise.resolve({ id }) };
}

function patchReq(body: unknown) {
  return new Request("http://localhost/api/creator/works/work-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockPrisma.creatorWork.findUnique.mockReset();
  mockPrisma.creatorWork.update.mockReset();
  mockPrisma.creatorWork.delete.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("/api/creator/works/[id]", () => {
  it("PATCH는 비로그인 요청에 401을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await PATCH(patchReq({ title: "수정" }), ctx());

    expect(res.status).toBe(401);
  });

  it("PATCH는 본인 작업물을 수정한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockPrisma.creatorWork.findUnique.mockResolvedValue(WORK);
    mockPrisma.creatorWork.update.mockResolvedValue({ ...WORK, title: "수정" });

    const res = await PATCH(patchReq({ title: "수정", description: null }), ctx());

    expect(res.status).toBe(200);
    expect(mockPrisma.creatorWork.update).toHaveBeenCalledWith({
      where: { id: "work-1" },
      data: expect.objectContaining({ title: "수정", description: null }),
    });
  });

  it("PATCH 검증 실패는 400을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);

    const res = await PATCH(patchReq({ title: "" }), ctx());

    expect(res.status).toBe(400);
    expect(mockPrisma.creatorWork.findUnique).not.toHaveBeenCalled();
  });

  it("PATCH는 타 크리에이터 작업물에 403을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(OTHER_CREATOR);
    mockPrisma.creatorWork.findUnique.mockResolvedValue(WORK);

    const res = await PATCH(patchReq({ title: "수정" }), ctx());

    expect(res.status).toBe(403);
    expect(mockPrisma.creatorWork.update).not.toHaveBeenCalled();
  });

  it("DELETE는 본인 작업물을 삭제한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockPrisma.creatorWork.findUnique.mockResolvedValue(WORK);
    mockPrisma.creatorWork.delete.mockResolvedValue(WORK);

    const res = await DELETE(new Request("http://localhost/api/creator/works/work-1"), ctx());

    expect(res.status).toBe(200);
    expect(mockPrisma.creatorWork.delete).toHaveBeenCalledWith({ where: { id: "work-1" } });
  });

  it("DELETE는 존재하지 않는 작업물에 404를 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockPrisma.creatorWork.findUnique.mockResolvedValue(null);

    const res = await DELETE(new Request("http://localhost/api/creator/works/work-1"), ctx());

    expect(res.status).toBe(404);
    expect(mockPrisma.creatorWork.delete).not.toHaveBeenCalled();
  });
});
