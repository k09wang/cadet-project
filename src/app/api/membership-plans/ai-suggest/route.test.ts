import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- suggestMembership mock ---
const mockSuggestMembership = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ai/suggest", () => ({
  suggestMembership: (...args: unknown[]) => mockSuggestMembership(...args),
}));

// --- getCurrentUser mock ---
const mockGetCurrentUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

import { POST } from "@/app/api/membership-plans/ai-suggest/route";

const CREATOR_USER = {
  id: "u-creator",
  role: "CREATOR",
  creatorProfile: { id: "p-creator" },
};
const FAN_USER = { id: "u-fan", role: "FAN", creatorProfile: null };

function makeReq(body: unknown) {
  return new Request("http://localhost/api/membership-plans/ai-suggest", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockSuggestMembership.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("POST /api/membership-plans/ai-suggest (REQ-2-002)", () => {
  it("비로그인 시 401 반환", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq({ description: "테스트" }));
    expect(res.status).toBe(401);
  });

  it("팬(비크리에이터) 시 403 반환 (REQ-2-002)", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    const res = await POST(makeReq({ description: "테스트" }));
    expect(res.status).toBe(403);
  });

  it("description 누락 시 400 반환 (REQ-2-002)", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR_USER);
    const res = await POST(makeReq({ category: "드로잉" }));
    expect(res.status).toBe(400);
  });

  it("유효한 요청으로 200과 추천 결과 반환", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR_USER);
    const suggestion = {
      suggestedPrice: 9000,
      benefits: ["전용 커뮤니티"],
      reason: "추천 사유",
      source: "mock",
    };
    mockSuggestMembership.mockResolvedValue(suggestion);

    const res = await POST(makeReq({ description: "일러스트 팬 멤버십" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestedPrice).toBe(9000);
    expect(body.source).toBe("mock");
  });

  it("결과에 주차 구성(programStructure)이 포함되지 않는다 (REQ-2-001)", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR_USER);
    const suggestion = {
      suggestedPrice: 15000,
      benefits: ["전용 콘텐츠"],
      reason: "사유",
      source: "mock",
    };
    mockSuggestMembership.mockResolvedValue(suggestion);

    const res = await POST(makeReq({ description: "멤버십 설명" }));
    const body = await res.json();
    expect(body).not.toHaveProperty("programStructure");
  });

  it("Mock 폴백 결과 반환 시 source 표기 포함 (REQ-2-005, NFR-002)", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR_USER);
    const mockResult = { suggestedPrice: 5000, benefits: ["혜택"], reason: "사유", source: "mock" as const };
    mockSuggestMembership.mockResolvedValue(mockResult);

    const res = await POST(makeReq({ description: "멤버십" }));
    const body = await res.json();
    expect(body.source).toBeDefined();
  });
});
