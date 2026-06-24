import { prisma } from "@/lib/prisma";

/**
 * 리뷰 조회(read) 쿼리 (SPEC-008 FR-011, FR-012 + SPEC-013 양방향 평가).
 *
 * SPEC-013부터 리뷰는 양방향(팬→크리에이터, 크리에이터→팬)이다.
 *  - user   = 작성자(reviewer)
 *  - reviewee = 피평가자 (팬→크리에이터면 크리에이터 User, 크리에이터→팬이면 팬 User)
 * 크리에이터 평점은 revieweeId = 크리에이터 userId 인 리뷰만 집계한다.
 */

export type ProgramReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  createdAt: Date;
  revieweeId?: string | null;
  /** 작성자(reviewer). */
  user: { id: string; name: string };
  /** 피평가자(reviewee). SPEC-013 양방향 — optional relation이라 null 가능. */
  reviewee?: { id: string; name: string } | null;
};

/**
 * 프로그램 리뷰 목록 + 평균 평점 (FR-011, AC-010).
 * avgRating은 "크리에이터가 받은 평점"(revieweeId = 프로그램 소유 크리에이터 userId)만 집계한다 (AC-012).
 * 리뷰가 없으면 빈 배열과 avg=null.
 */
export async function listProgramReviews(
  programId: string,
): Promise<{ reviews: ProgramReviewItem[]; avgRating: number | null }> {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { creatorProfileId: true },
  });
  const ownerUserId = program
    ? (
        await prisma.creatorProfile.findUnique({
          where: { id: program.creatorProfileId },
          select: { userId: true },
        })
      )?.userId ?? null
    : null;

  const rows = await prisma.review.findMany({
    where: { programId },
    include: {
      reviewer: { select: { id: true, name: true } },
      reviewee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // schema 관계명은 reviewer/reviewee(SPEC-013). 외부 계약(ProgramReviewItem.user)은 user로 유지.
  const reviews: ProgramReviewItem[] = rows.map(({ reviewer, ...rest }) => ({
    ...rest,
    user: reviewer,
  }));

  // 크리에이터가 받은 리뷰(reviewer != owner, revieweeId = owner)만 평점 집계
  const towardsOwner = reviews.filter(
    (r) => ownerUserId != null && r.revieweeId === ownerUserId,
  );
  const avgRating = towardsOwner.length
    ? Math.round(
        (towardsOwner.reduce((sum, r) => sum + r.rating, 0) / towardsOwner.length) * 10,
      ) / 10
    : null;

  return { reviews, avgRating };
}

/**
 * 크리에이터의 평균 평점과 리뷰 수 (FR-012, AC-011, AC-012).
 * SPEC-013: revieweeId = 크리에이터 userId 인 리뷰만 집계한다 (크리에이터가 받은 평가).
 * 리뷰가 없으면 { avg: null, count: 0 }.
 */
export async function getCreatorRating(
  creatorProfileId: string,
): Promise<{ avg: number | null; count: number }> {
  const owner = await prisma.creatorProfile.findUnique({
    where: { id: creatorProfileId },
    select: { userId: true },
  });
  if (!owner) return { avg: null, count: 0 };

  const agg = await prisma.review.aggregate({
    where: { revieweeId: owner.userId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const avg =
    agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : null;
  return { avg, count: agg._count.rating };
}

/**
 * 특정 사용자가 받은 리뷰(평점) 요약 (SPEC-013 양방향 — 크리에이터 평판 등).
 */
export async function getReceivedReviews(
  userId: string,
): Promise<{ avg: number | null; count: number }> {
  const agg = await prisma.review.aggregate({
    where: { revieweeId: userId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const avg =
    agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : null;
  return { avg, count: agg._count.rating };
}

/**
 * 리뷰 작성 자격 판정 (SPEC-008 FR-005, FR-009, FR-006; SPEC-013 완료승인 기반; UI 표시용).
 * - canReview: 본인 참여가 완료 승인(completionApprovedAt != null)된 팬.
 *   (SPEC-013: 에스크로 완료 승인 후에만 리뷰 가능)
 * - alreadyReviewed: 이 프로그램에서 작성자가 이미 리뷰를 남겼는지(양방향 무관, 1인 1회 기준).
 * 비로그인(user=null)이면 둘 다 false.
 */
export async function getReviewEligibility(
  programId: string,
  userId: string | null,
): Promise<{ canReview: boolean; alreadyReviewed: boolean }> {
  if (!userId) return { canReview: false, alreadyReviewed: false };

  const [completed, existing] = await Promise.all([
    prisma.programApplication.findFirst({
      where: { programId, userId, completionApprovedAt: { not: null } },
      select: { id: true },
    }),
    prisma.review.findFirst({
      where: { programId, userId },
      select: { id: true },
    }),
  ]);

  return { canReview: !!completed, alreadyReviewed: !!existing };
}
