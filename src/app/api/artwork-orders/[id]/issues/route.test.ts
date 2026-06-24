import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentUser: (...a: unknown[]) => mockGetCurrentUser(...a) }));

const mockReportArtworkOrderIssue = vi.fn();
vi.mock("@/lib/artwork-fulfillment", () => ({
  reportArtworkOrderIssue: (...a: unknown[]) => mockReportArtworkOrderIssue(...a),
}));

import { POST } from "@/app/api/artwork-orders/[id]/issues/route";

const FAN = { id: "fan-1", role: "FAN", creatorProfile: null };
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function postReq(body: unknown) {
  return new Request("http://localhost/api/artwork-orders/order-1/issues", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockReportArtworkOrderIssue.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("POST /api/artwork-orders/:id/issues", () => {
  it("비로그인은 401", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(postReq({ type: "DAMAGED", message: "파손" }), ctx("order-1"));

    expect(res.status).toBe(401);
  });

  it("검증 실패는 400", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN);

    const res = await POST(postReq({ type: "BAD", message: "파손" }), ctx("order-1"));

    expect(res.status).toBe(400);
    expect(mockReportArtworkOrderIssue).not.toHaveBeenCalled();
  });

  it("유효한 요청은 문제 신고 서비스로 전달한다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN);
    mockReportArtworkOrderIssue.mockResolvedValue({
      ok: true,
      data: { issueId: "issue-1", orderStatus: "ISSUE_OPENED" },
    });

    const res = await POST(
      postReq({ type: "DAMAGED", message: "작품이 파손되어 도착했습니다." }),
      ctx("order-1"),
    );

    expect(res.status).toBe(201);
    expect(mockReportArtworkOrderIssue).toHaveBeenCalledWith(
      { userId: "fan-1", role: "FAN", creatorProfileId: undefined },
      "order-1",
      expect.objectContaining({ type: "DAMAGED" }),
    );
  });
});
