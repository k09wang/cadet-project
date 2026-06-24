import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentUser: (...a: unknown[]) => mockGetCurrentUser(...a) }));

const mockCancelProgramApplication = vi.fn();
const mockRemoveProgramParticipant = vi.fn();
vi.mock("@/lib/applications", () => ({
  cancelProgramApplication: (...a: unknown[]) => mockCancelProgramApplication(...a),
  removeProgramParticipant: (...a: unknown[]) => mockRemoveProgramParticipant(...a),
}));

import { PATCH } from "@/app/api/applications/[id]/route";

const CREATOR = { id: "u-2", role: "CREATOR", creatorProfile: { id: "cp-1" } };
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function patchReq(body: unknown) {
  return new Request("http://localhost/api/applications/app-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockCancelProgramApplication.mockReset();
  mockRemoveProgramParticipant.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("PATCH /api/applications/:id (선착순 신청 취소/멤버 제외)", () => {
  it("비로그인 401", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await PATCH(patchReq({ action: "cancel" }), ctx("app-1"));
    expect(res.status).toBe(401);
  });

  it("빈 바디면 400", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    const res = await PATCH(patchReq({}), ctx("app-1"));
    expect(res.status).toBe(400);
  });

  it("잘못된 action이면 400", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    const res = await PATCH(patchReq({ action: "approve" }), ctx("app-1"));
    expect(res.status).toBe(400);
  });

  it("레거시 accept 액션은 400으로 거부한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    const res = await PATCH(patchReq({ action: "accept" }), ctx("app-1"));
    expect(res.status).toBe(400);
    expect(mockCancelProgramApplication).not.toHaveBeenCalled();
    expect(mockRemoveProgramParticipant).not.toHaveBeenCalled();
  });

  it("레거시 reject 액션은 400으로 거부한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    const res = await PATCH(patchReq({ action: "reject" }), ctx("app-1"));
    expect(res.status).toBe(400);
    expect(mockCancelProgramApplication).not.toHaveBeenCalled();
    expect(mockRemoveProgramParticipant).not.toHaveBeenCalled();
  });

  it("서비스 403(타인프로그램) 반환 시 403", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockRemoveProgramParticipant.mockResolvedValue({
      ok: false,
      status: 403,
      error: "Forbidden: not the program owner",
    });
    const res = await PATCH(patchReq({ action: "remove" }), ctx("app-1"));
    expect(res.status).toBe(403);
  });

  it("cancel 액션은 팬 본인 취소 서비스로 전달한다 (SPEC-015)", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "fan-1", role: "FAN", creatorProfile: null });
    mockCancelProgramApplication.mockResolvedValue({
      ok: true,
      data: { id: "app-1", status: "CANCELLED" },
    });

    const res = await PATCH(patchReq({ action: "cancel" }), ctx("app-1"));

    expect(res.status).toBe(200);
    expect(mockCancelProgramApplication).toHaveBeenCalledWith("app-1", "fan-1");
  });

  it("remove 액션은 크리에이터 참여자 제외 서비스로 전달한다 (SPEC-015)", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockRemoveProgramParticipant.mockResolvedValue({
      ok: true,
      data: { id: "app-1", status: "REMOVED" },
    });

    const res = await PATCH(
      patchReq({ action: "remove", removedReason: "운영 사유" }),
      ctx("app-1"),
    );

    expect(res.status).toBe(200);
    expect(mockRemoveProgramParticipant).toHaveBeenCalledWith(
      { role: "CREATOR", creatorProfileId: "cp-1" },
      "app-1",
      "운영 사유",
    );
  });
});
