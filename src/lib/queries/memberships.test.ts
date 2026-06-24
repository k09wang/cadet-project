import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Prisma mock (vi.hoisted 패턴) ---
const mockFindMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    membershipPlan: { findMany: (...args: unknown[]) => mockFindMany(...args) },
  },
}));

import { listMembershipPlansByCreator } from "@/lib/queries/memberships";

beforeEach(() => {
  mockFindMany.mockReset();
});

describe("listMembershipPlansByCreator (REQ-1-001)", () => {
  it("creatorProfileId로 플랜을 createdAt 내림차순으로 조회한다", async () => {
    const plans = [
      { id: "p-2", title: "실버", priceKrw: 10000, createdAt: new Date("2026-06-21") },
      { id: "p-1", title: "브론즈", priceKrw: 5000, createdAt: new Date("2026-06-20") },
    ];
    mockFindMany.mockResolvedValue(plans);

    const result = await listMembershipPlansByCreator("creator-1");

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { creatorProfileId: "creator-1" },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toEqual(plans);
  });

  it("플랜이 없으면 빈 배열을 반환한다", async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await listMembershipPlansByCreator("creator-no-plans");
    expect(result).toEqual([]);
  });
});
