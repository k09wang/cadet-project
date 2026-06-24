import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Prisma mock (vi.hoisted 패턴) ---
const mockPlanFindUnique = vi.hoisted(() => vi.fn());
const mockPlanUpdate = vi.hoisted(() => vi.fn());
const mockPlanDelete = vi.hoisted(() => vi.fn());
const mockMembershipCount = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    membershipPlan: {
      findUnique: (...args: unknown[]) => mockPlanFindUnique(...args),
      update: (...args: unknown[]) => mockPlanUpdate(...args),
      delete: (...args: unknown[]) => mockPlanDelete(...args),
    },
    membership: {
      count: (...args: unknown[]) => mockMembershipCount(...args),
    },
  },
}));

// --- getCurrentUser mock ---
const mockGetCurrentUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

import { PATCH, DELETE } from "@/app/api/membership-plans/[id]/route";

const CREATOR_USER = {
  id: "u-creator",
  role: "CREATOR",
  creatorProfile: { id: "p-creator", studioName: "스튜디오" },
};
const FAN_USER = { id: "u-fan", role: "FAN", creatorProfile: null };
const OTHER_CREATOR = {
  id: "u-other",
  role: "CREATOR",
  creatorProfile: { id: "p-other", studioName: "다른 스튜디오" },
};

const PLAN = { id: "plan-1", title: "브론즈", priceKrw: 5000, creatorProfileId: "p-creator" };

function makeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makePatchReq(body: unknown) {
  return new Request("http://localhost/api/membership-plans/plan-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockPlanFindUnique.mockReset();
  mockPlanUpdate.mockReset();
  mockPlanDelete.mockReset();
  mockMembershipCount.mockReset();
});
afterEach(() => vi.clearAllMocks());

// ===== PATCH =====
describe("PATCH /api/membership-plans/[id] (REQ-1-005, REQ-1-006)", () => {
  it("비로그인 시 401 반환", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await PATCH(makePatchReq({ priceKrw: 9000 }), makeCtx("plan-1"));
    expect(res.status).toBe(401);
  });

  it("팬(비크리에이터) 요청 시 403 반환 (REQ-1-006)", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    const res = await PATCH(makePatchReq({ priceKrw: 9000 }), makeCtx("plan-1"));
    expect(res.status).toBe(403);
  });

  it("타 크리에이터가 남의 플랜을 수정하려 하면 403 반환 (REQ-1-006)", async () => {
    mockGetCurrentUser.mockResolvedValue(OTHER_CREATOR);
    mockPlanFindUnique.mockResolvedValue(PLAN);
    const res = await PATCH(makePatchReq({ priceKrw: 9000 }), makeCtx("plan-1"));
    expect(res.status).toBe(403);
    expect(mockPlanUpdate).not.toHaveBeenCalled();
  });

  it("검증 실패 시 400 반환", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR_USER);
    const res = await PATCH(makePatchReq({ priceKrw: -100 }), makeCtx("plan-1"));
    expect(res.status).toBe(400);
  });

  it("존재하지 않는 플랜이면 404 반환", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR_USER);
    mockPlanFindUnique.mockResolvedValue(null);
    const res = await PATCH(makePatchReq({ priceKrw: 9000 }), makeCtx("plan-not-exist"));
    expect(res.status).toBe(404);
  });

  it("본인 플랜 수정 성공 시 200과 갱신 레코드 반환 (REQ-1-005, AC-1-005)", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR_USER);
    mockPlanFindUnique.mockResolvedValue(PLAN);
    const updated = { ...PLAN, priceKrw: 9000 };
    mockPlanUpdate.mockResolvedValue(updated);

    const res = await PATCH(makePatchReq({ priceKrw: 9000 }), makeCtx("plan-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.priceKrw).toBe(9000);
  });
});

// ===== DELETE =====
describe("DELETE /api/membership-plans/[id] (REQ-1-007, REQ-1-008)", () => {
  it("비로그인 시 401 반환", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await DELETE(new Request("http://localhost/"), makeCtx("plan-1"));
    expect(res.status).toBe(401);
  });

  it("팬 요청 시 403 반환 (REQ-1-006)", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    const res = await DELETE(new Request("http://localhost/"), makeCtx("plan-1"));
    expect(res.status).toBe(403);
  });

  it("타 크리에이터 요청 시 403 반환 (REQ-1-006)", async () => {
    mockGetCurrentUser.mockResolvedValue(OTHER_CREATOR);
    mockPlanFindUnique.mockResolvedValue(PLAN);
    const res = await DELETE(new Request("http://localhost/"), makeCtx("plan-1"));
    expect(res.status).toBe(403);
    expect(mockPlanDelete).not.toHaveBeenCalled();
  });

  it("활성 멤버가 있는 플랜 삭제 시 409 반환 (REQ-1-007, 확정 결정 #1)", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR_USER);
    mockPlanFindUnique.mockResolvedValue(PLAN);
    mockMembershipCount.mockResolvedValue(2);

    const res = await DELETE(new Request("http://localhost/"), makeCtx("plan-1"));
    expect(res.status).toBe(409);
    expect(mockPlanDelete).not.toHaveBeenCalled();
  });

  it("활성 멤버 없는 플랜 삭제 성공 시 200 { ok: true } 반환 (REQ-1-008)", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR_USER);
    mockPlanFindUnique.mockResolvedValue(PLAN);
    mockMembershipCount.mockResolvedValue(0);
    mockPlanDelete.mockResolvedValue(PLAN);

    const res = await DELETE(new Request("http://localhost/"), makeCtx("plan-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockPlanDelete).toHaveBeenCalledWith({ where: { id: "plan-1" } });
  });
});
