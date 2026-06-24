import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentUser: (...a: unknown[]) => mockGetCurrentUser(...a) }));

const mockShipArtworkOrder = vi.fn();
vi.mock("@/lib/artwork-fulfillment", () => ({
  shipArtworkOrder: (...a: unknown[]) => mockShipArtworkOrder(...a),
}));

import { POST } from "@/app/api/artwork-orders/[id]/shipment/route";

const CREATOR = { id: "creator-user", role: "CREATOR", creatorProfile: { id: "cp-1" } };
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function postReq(body: unknown) {
  return new Request("http://localhost/api/artwork-orders/order-1/shipment", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockShipArtworkOrder.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("POST /api/artwork-orders/:id/shipment", () => {
  it("비로그인은 401", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(postReq({ carrier: "CJ", trackingNo: "123" }), ctx("order-1"));

    expect(res.status).toBe(401);
  });

  it("검증 실패는 400", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);

    const res = await POST(postReq({ carrier: "" }), ctx("order-1"));

    expect(res.status).toBe(400);
    expect(mockShipArtworkOrder).not.toHaveBeenCalled();
  });

  it("유효한 요청은 발송 서비스로 전달한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);
    mockShipArtworkOrder.mockResolvedValue({
      ok: true,
      data: { orderId: "order-1", status: "SHIPPED", shipmentId: "ship-1" },
    });

    const res = await POST(postReq({ carrier: "CJ", trackingNo: "123" }), ctx("order-1"));

    expect(res.status).toBe(200);
    expect(mockShipArtworkOrder).toHaveBeenCalledWith(
      { userId: "creator-user", role: "CREATOR", creatorProfileId: "cp-1" },
      "order-1",
      expect.objectContaining({ carrier: "CJ", trackingNo: "123" }),
    );
  });
});
