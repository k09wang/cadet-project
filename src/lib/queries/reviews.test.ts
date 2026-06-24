import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockReviewFindMany = vi.fn();
const mockReviewAggregate = vi.fn();
const mockReviewFindFirst = vi.fn();
const mockProgramFindUnique = vi.fn();
const mockCreatorProfileFindUnique = vi.fn();
const mockProgramApplicationFindFirst = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: {
      findMany: (...a: unknown[]) => mockReviewFindMany(...a),
      aggregate: (...a: unknown[]) => mockReviewAggregate(...a),
      findFirst: (...a: unknown[]) => mockReviewFindFirst(...a),
    },
    program: {
      findUnique: (...a: unknown[]) => mockProgramFindUnique(...a),
    },
    creatorProfile: {
      findUnique: (...a: unknown[]) => mockCreatorProfileFindUnique(...a),
    },
    programApplication: {
      findFirst: (...a: unknown[]) => mockProgramApplicationFindFirst(...a),
    },
  },
}));

import {
  getCreatorRating,
  getReviewEligibility,
  listProgramReviews,
} from "@/lib/queries/reviews";

const CREATOR_USER_ID = "creator-user-1";

beforeEach(() => {
  mockReviewFindMany.mockReset();
  mockReviewAggregate.mockReset();
  mockReviewFindFirst.mockReset();
  mockProgramFindUnique.mockReset();
  mockCreatorProfileFindUnique.mockReset();
  mockProgramApplicationFindFirst.mockReset();
  // listProgramReviews / getCreatorRating 공통 owner 조회 기본값
  mockProgramFindUnique.mockResolvedValue({ creatorProfileId: "cprof-1" });
  mockCreatorProfileFindUnique.mockResolvedValue({ userId: CREATOR_USER_ID });
});
afterEach(() => vi.clearAllMocks());

describe("listProgramReviews (FR-011, AC-010, AC-012 + SPEC-013 양방향)", () => {
  it("programId로 필터하고 최신순 정렬한다", async () => {
    mockReviewFindMany.mockResolvedValue([]);
    await listProgramReviews("prog-1");
    const arg = mockReviewFindMany.mock.calls[0][0];
    expect(arg.where.programId).toBe("prog-1");
    expect(arg.orderBy.createdAt).toBe("desc");
  });

  it("크리에이터가 받은 리뷰(reviewer != owner, revieweeId=owner) 평균을 계산한다 (AC-010)", async () => {
    mockReviewFindMany.mockResolvedValue([
      { rating: 4, revieweeId: CREATOR_USER_ID, user: { id: "fan-1", name: "F1" }, reviewee: { id: CREATOR_USER_ID, name: "C" } },
      { rating: 5, revieweeId: CREATOR_USER_ID, user: { id: "fan-2", name: "F2" }, reviewee: { id: CREATOR_USER_ID, name: "C" } },
    ]);
    const { avgRating, reviews } = await listProgramReviews("prog-1");
    expect(reviews).toHaveLength(2);
    expect(avgRating).toBe(4.5);
  });

  it("크리에이터가 작성한 리뷰(reviewer=owner)는 평균에서 제외한다 (SPEC-013)", async () => {
    mockReviewFindMany.mockResolvedValue([
      { rating: 4, revieweeId: CREATOR_USER_ID, user: { id: "fan-1", name: "F1" }, reviewee: { id: CREATOR_USER_ID, name: "C" } },
      // 크리에이터가 팬에게 쓴 리뷰 — 집계 제외
      { rating: 1, revieweeId: "fan-1", user: { id: CREATOR_USER_ID, name: "C" }, reviewee: { id: "fan-1", name: "F1" } },
    ]);
    const { avgRating } = await listProgramReviews("prog-1");
    expect(avgRating).toBe(4.0);
  });

  it("리뷰가 없으면 avgRating=null (AC-012)", async () => {
    mockReviewFindMany.mockResolvedValue([]);
    const { avgRating, reviews } = await listProgramReviews("prog-1");
    expect(reviews).toEqual([]);
    expect(avgRating).toBeNull();
  });
});

describe("getCreatorRating (FR-012, AC-011, AC-012 + SPEC-013 revieweeId 기반)", () => {
  it("revieweeId = 크리에이터 userId 인 리뷰를 집계한다", async () => {
    mockReviewAggregate.mockResolvedValue({
      _avg: { rating: 4 },
      _count: { rating: 3 },
    });
    const result = await getCreatorRating("cprof-1");
    const arg = mockReviewAggregate.mock.calls[0][0];
    expect(arg.where.revieweeId).toBe(CREATOR_USER_ID);
    expect(result.avg).toBe(4.0);
    expect(result.count).toBe(3);
  });

  it("리뷰가 없으면 avg=null, count=0 (AC-012)", async () => {
    mockReviewAggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: { rating: 0 },
    });
    const result = await getCreatorRating("cprof-1");
    expect(result.avg).toBeNull();
    expect(result.count).toBe(0);
  });

  it("평균을 소수 1자리로 반올림한다 (4.1666 → 4.2)", async () => {
    mockReviewAggregate.mockResolvedValue({
      _avg: { rating: 4.166666 },
      _count: { rating: 6 },
    });
    const result = await getCreatorRating("cprof-1");
    expect(result.avg).toBe(4.2);
  });

  it("크리에이터 미존재 시 {avg:null,count:0}", async () => {
    mockCreatorProfileFindUnique.mockResolvedValue(null);
    const result = await getCreatorRating("cprof-x");
    expect(result).toEqual({ avg: null, count: 0 });
  });
});

describe("getReviewEligibility (FR-005, FR-006, FR-009 + SPEC-013 완료승인 기반)", () => {
  it("비로그인이면 canReview=false, alreadyReviewed=false", async () => {
    const result = await getReviewEligibility("prog-1", null);
    expect(result).toEqual({ canReview: false, alreadyReviewed: false });
  });

  it("완료 승인된 참여 + 미작성이면 canReview=true", async () => {
    mockProgramApplicationFindFirst.mockResolvedValue({ id: "app-1" });
    mockReviewFindFirst.mockResolvedValue(null);
    const result = await getReviewEligibility("prog-1", "fan-1");
    expect(result).toEqual({ canReview: true, alreadyReviewed: false });
  });

  it("완료 승인된 참여 + 이미 작성이면 alreadyReviewed=true", async () => {
    mockProgramApplicationFindFirst.mockResolvedValue({ id: "app-1" });
    mockReviewFindFirst.mockResolvedValue({ id: "rev-1" });
    const result = await getReviewEligibility("prog-1", "fan-1");
    expect(result).toEqual({ canReview: true, alreadyReviewed: true });
  });

  it("완료 승인되지 않았으면 canReview=false (SPEC-013)", async () => {
    mockProgramApplicationFindFirst.mockResolvedValue(null);
    mockReviewFindFirst.mockResolvedValue(null);
    const result = await getReviewEligibility("prog-1", "fan-1");
    expect(result.canReview).toBe(false);
  });
});
