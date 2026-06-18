import { prisma } from "@/lib/prisma";

/**
 * 신청 조회(read) 쿼리 (SPEC-005 FR-002, AC-002).
 */

/**
 * 크리에이터를 위한 프로그램 신청 목록 (FR-002).
 * 최신순 정렬, 신청자 정보 포함.
 */
export function listApplicationsForCreator(programId: string) {
  return prisma.programApplication.findMany({
    where: { programId },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 활성 신청 조회 (FR-002, AC-002).
 * PENDING 또는 ACCEPTED 상태의 신청만 활성으로 간주한다.
 * 중복 신청/이미 신청 판정용으로 사용된다.
 */
export function findActiveApplication(programId: string, userId: string) {
  return prisma.programApplication.findFirst({
    where: {
      programId,
      userId,
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });
}
