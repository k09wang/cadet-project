import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentUser: (...a: unknown[]) => mockGetCurrentUser(...a) }));

const mockMarkReceived = vi.fn();
const mockRefund = vi.fn();
const mockResolveIssue = vi.fn();
vi.mock("@/lib/artwork-fulfillment", () => ({
  markArtworkOrderReceived: (...a: unknown[]) => mockMarkReceived(...a),
  refundArtworkOrder: (...a: unknown[]) => mockRefund(...a),
  resolveArtworkOrderIssue: (...a: unknown[]) => mockResolveIssue(...a),
}));

import { POST as POST_RECEIVED } from "@/app/api/artwork-orders/[id]/received/route";
import { POST as POST_REFUND } from "@/app/api/artwork-orders/[id]/refund/route";
import { POST as POST_RESOLVE } from "@/app/api/artwork-orders/[id]/issues/resolve/route";

const CREATOR = { id: "u-creator", role: "CREATOR", creatorProfile: { id: "cp-1" } };
const FAN = { id: "fan-1", role: "FAN", creatorProfile: null };

function ctx(id = "order-1") {
  return { params: Promise.resolve({ id }) };
}

function jsonReq(body: unknown) {
  return new Request("http://localhost/api/artwork-orders/order-1/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCurrentUser.mockReset();
  mockMarkReceived.mockReset();
  mockRefund.mockReset();
  mockResolveIssue.mockReset();
});

describe("artwork order action routes", () => {
  it("received는 비로그인 요청에 401을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST_RECEIVED(new Request("http://localhost"), ctx());

    expect(res.status).toBe(401);
    expect(mockMarkReceived).not.toHaveBeenCalled();
  });

  it("received는 팬 컨텍스트로 수령 확인 서비스를 호출한다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN);
    mockMarkReceived.mockResolvedValue({ ok: true, data: { orderId: "order-1", status: "RECEIVED" } });

    const res = await POST_RECEIVED(new Request("http://localhost"), ctx());

    expect(res.status).toBe(200);
    expect(mockMarkReceived).toHaveBeenCalledWith(
      { userId: "fan-1", role: "FAN", creatorProfileId: undefined },
      "order-1",
    );
  });

  it("refund는 검증된 환불 사유로 서비스를 호출한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockRefund.mockResolvedValue({ ok: true, data: { orderId: "order-1", status: "REFUNDED" } });

    const res = await POST_REFUND(jsonReq({ reason: "파손 환불" }), ctx());

    expect(res.status).toBe(200);
    expect(mockRefund).toHaveBeenCalledWith(
      { userId: "u-creator", role: "CREATOR", creatorProfileId: "cp-1" },
      "order-1",
      { reason: "파손 환불" },
    );
  });

  it("refund 검증 실패는 400을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);

    const res = await POST_REFUND(jsonReq({ reason: "" }), ctx());

    expect(res.status).toBe(400);
    expect(mockRefund).not.toHaveBeenCalled();
  });

  it("resolve는 검증된 해결 메모로 서비스를 호출한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockResolveIssue.mockResolvedValue({ ok: true, data: { orderId: "order-1", status: "RECEIVED" } });

    const res = await POST_RESOLVE(jsonReq({ resolutionNote: "재발송 완료" }), ctx());

    expect(res.status).toBe(200);
    expect(mockResolveIssue).toHaveBeenCalledWith(
      { userId: "u-creator", role: "CREATOR", creatorProfileId: "cp-1" },
      "order-1",
      { resolutionNote: "재발송 완료" },
    );
  });
});
