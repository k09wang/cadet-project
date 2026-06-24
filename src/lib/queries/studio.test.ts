import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock prisma ---
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockMembershipPlanFindFirst = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    creatorProfile: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    membershipPlan: {
      findFirst: (...args: unknown[]) => mockMembershipPlanFindFirst(...args),
    },
  },
}));

import {
  getCreatorStudio,
  getMembershipPlanForCheckout,
  listCreators,
} from "@/lib/queries/studio";

beforeEach(() => {
  mockFindUnique.mockReset();
  mockFindMany.mockReset();
  mockMembershipPlanFindFirst.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("getCreatorStudio", () => {
  it("returns the profile with posts/plans/programs in a single query (NFR-003)", async () => {
    const profile = {
      id: "p-1",
      studioName: "신진작가 스튜디오",
      bio: "bio",
      posts: [{ id: "post-1" }],
      plans: [{ id: "plan-1" }],
      programs: [{ id: "prog-1" }],
      artworks: [{ id: "art-1" }],
    };
    mockFindUnique.mockResolvedValue(profile);

    const result = await getCreatorStudio("p-1");

    expect(result).toEqual(profile);
    // NFR-003: 단일 findUnique 호출 + include 한 번에 관계 로드
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    const call = mockFindUnique.mock.calls[0][0];
    expect(call.where).toEqual({ id: "p-1" });
    // posts는 orderBy를 쓰므로 객체, plans/programs는 truthy
    expect(call.include.posts).toEqual(expect.any(Object));
    expect(call.include.plans).toBeTruthy();
    expect(call.include.programs).toBeTruthy();
    expect(call.include.artworks).toEqual(
      expect.objectContaining({
        where: { status: "PUBLISHED", stock: { gt: 0 } },
        orderBy: { createdAt: "desc" },
      }),
    );
    expect(call.include.works).toEqual({
      orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
    });
  });

  it("returns null when the profile is not found (FR-011)", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(getCreatorStudio("ghost")).resolves.toBeNull();
  });

  it("orders posts by createdAt desc (NFR-003)", async () => {
    mockFindUnique.mockResolvedValue({ id: "p-1", posts: [], plans: [], programs: [] });
    await getCreatorStudio("p-1");
    const call = mockFindUnique.mock.calls[0][0];
    expect(call.include.posts).toEqual(
      expect.objectContaining({ orderBy: { createdAt: "desc" } }),
    );
  });
});

describe("getMembershipPlanForCheckout", () => {
  it("creatorProfileId와 planId가 일치하는 플랜만 조회한다", () => {
    mockMembershipPlanFindFirst.mockReturnValue("plan");

    expect(getMembershipPlanForCheckout("cp-1", "plan-1")).toBe("plan");

    expect(mockMembershipPlanFindFirst).toHaveBeenCalledWith({
      where: {
        id: "plan-1",
        creatorProfileId: "cp-1",
      },
      include: {
        creatorProfile: { select: { id: true, studioName: true } },
      },
    });
  });
});

describe("listCreators", () => {
  it("returns creators filtered by user role CREATOR (AC-001)", async () => {
    const rows = [
      { id: "p-1", studioName: "스튜디오 1", bio: null, profileImageUrl: null, category: null },
      { id: "p-2", studioName: "스튜디오 2", bio: null, profileImageUrl: null, category: null },
    ];
    mockFindMany.mockResolvedValue(rows);

    const result = await listCreators();
    expect(result).toHaveLength(2);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const call = mockFindMany.mock.calls[0][0];
    expect(call).toMatchObject({
      where: { user: { role: "CREATOR" } },
    });
  });

  it("selects only public-card fields", async () => {
    mockFindMany.mockResolvedValue([]);
    await listCreators();
    const call = mockFindMany.mock.calls[0][0];
    // 핵심 공개 카드 필드가 select에 포함되어야 함
    expect(call.select).toMatchObject({
      id: true,
      studioName: true,
      bio: true,
      profileImageUrl: true,
      category: true,
    });
  });
});
