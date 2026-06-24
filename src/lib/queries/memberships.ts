import { prisma } from "@/lib/prisma";

/**
 * 크리에이터 본인 멤버십 플랜 목록 조회 (SPEC-014 REQ-1-001).
 * createdAt 내림차순(최신순)으로 반환한다.
 */
export function listMembershipPlansByCreator(creatorProfileId: string) {
  return prisma.membershipPlan.findMany({
    where: { creatorProfileId },
    orderBy: { createdAt: "desc" },
  });
}
