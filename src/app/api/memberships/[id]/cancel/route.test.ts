import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentUser: (...a: unknown[]) => mockGetCurrentUser(...a) }));

const mockCancelMembership = vi.fn();
vi.mock("@/lib/membership", () => ({
  cancelMembership: (...a: unknown[]) => mockCancelMembership(...a),
}));

import { PATCH } from "@/app/api/memberships/[id]/cancel/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockCancelMembership.mockReset();
});

describe("PATCH /api/memberships/:id/cancel", () => {
  it("비로그인은 401", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await PATCH(new Request("http://localhost/api/memberships/mem-1/cancel"), ctx("mem-1"));

    expect(res.status).toBe(401);
  });

  it("본인 멤버십 취소 서비스를 호출한다", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "fan-1", role: "FAN" });
    mockCancelMembership.mockResolvedValue({
      ok: true,
      data: { id: "mem-1", status: "CANCELLED", cancelledAt: "2026-06-24T00:00:00Z" },
    });

    const res = await PATCH(new Request("http://localhost/api/memberships/mem-1/cancel"), ctx("mem-1"));

    expect(res.status).toBe(200);
    expect(mockCancelMembership).toHaveBeenCalledWith("fan-1", "mem-1");
  });
});
