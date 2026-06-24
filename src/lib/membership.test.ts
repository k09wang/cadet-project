import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Prisma mock ---
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    membership: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

import { cancelMembership, isActiveMember } from "@/lib/membership";

beforeEach(() => {
  mockFindFirst.mockReset();
  mockFindUnique.mockReset();
  mockUpdate.mockReset();
});

describe("isActiveMember (FR-007, AC-008)", () => {
  it("팬이 해당 크리에이터의 플랜에 멤버십이 있으면 true를 반환한다", async () => {
    mockFindFirst.mockResolvedValue({ id: "m-1" });
    const result = await isActiveMember("u-fan", "p-creator");
    expect(result).toBe(true);
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        userId: "u-fan",
        plan: { creatorProfileId: "p-creator" },
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
      },
    });
  });

  it("멤버십 레코드가 없으면 false를 반환한다", async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await isActiveMember("u-fan", "p-creator");
    expect(result).toBe(false);
  });

  it("다른 크리에이터의 플랜에 가입된 팬은 false를 반환한다 (AC-008 Y에 대한 false)", async () => {
    // 팬 A는 크리에이터 X에 가입 → 크리에이터 Y에 대해서는 false
    mockFindFirst.mockResolvedValue(null);
    const result = await isActiveMember("u-fan", "p-other-creator");
    expect(result).toBe(false);
  });
});

describe("cancelMembership", () => {
  it("본인 ACTIVE 멤버십을 CANCELLED로 변경한다", async () => {
    mockFindUnique.mockResolvedValue({ id: "mem-1", userId: "fan-1", status: "ACTIVE" });
    mockUpdate.mockResolvedValue({
      id: "mem-1",
      status: "CANCELLED",
      cancelledAt: new Date("2026-06-24T00:00:00Z"),
    });

    const result = await cancelMembership("fan-1", "mem-1");

    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "mem-1" },
      data: {
        status: "CANCELLED",
        cancelledAt: expect.any(Date),
      },
      select: { id: true, status: true, cancelledAt: true },
    });
  });

  it("타인 멤버십은 취소하지 않는다", async () => {
    mockFindUnique.mockResolvedValue({ id: "mem-1", userId: "other", status: "ACTIVE" });

    const result = await cancelMembership("fan-1", "mem-1");

    expect(result).toEqual({ ok: false, status: 403, error: "Forbidden: not your membership" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("이미 취소된 멤버십은 400을 반환한다", async () => {
    mockFindUnique.mockResolvedValue({ id: "mem-1", userId: "fan-1", status: "CANCELLED" });

    const result = await cancelMembership("fan-1", "mem-1");

    expect(result).toEqual({ ok: false, status: 400, error: "Membership is not active" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
