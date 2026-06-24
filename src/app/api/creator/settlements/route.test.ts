import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentUser: (...a: unknown[]) => mockGetCurrentUser(...a) }));

const mockListCreatorSettlements = vi.fn();
vi.mock("@/lib/queries/contracts", () => ({
  listCreatorSettlements: (...a: unknown[]) => mockListCreatorSettlements(...a),
}));

import { GET } from "@/app/api/creator/settlements/route";

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockListCreatorSettlements.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("GET /api/creator/settlements", () => {
  it("비로그인은 401", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("크리에이터가 아니면 403", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "fan-1", role: "FAN", creatorProfile: null });

    const res = await GET();

    expect(res.status).toBe(403);
    expect(mockListCreatorSettlements).not.toHaveBeenCalled();
  });

  it("크리에이터 본인의 정산 목록을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "creator-user",
      role: "CREATOR",
      creatorProfile: { id: "cp-1" },
    });
    mockListCreatorSettlements.mockResolvedValue([{ id: "set-1", status: "PENDING" }]);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(mockListCreatorSettlements).toHaveBeenCalledWith("cp-1");
    expect(await res.json()).toEqual({ settlements: [{ id: "set-1", status: "PENDING" }] });
  });
});
