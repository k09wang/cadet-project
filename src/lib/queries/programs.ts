import { prisma } from "@/lib/prisma";
import { PUBLIC_PROGRAM_STATUSES } from "@/lib/program-status";

/**
 * 프로그램 조회(read) 쿼리 (SPEC-004 FR-003, FR-004, FR-010, FR-011, NFR-004).
 * 공개 목록은 deletedAt IS NULL AND status IN (...) 인덱스 활용 쿼리로 로드한다.
 */

/** 공개 목록(/programs) — DRAFT/CANCELLED 및 soft-delete 제외 (FR-003). */
export function listPublicPrograms(opts?: { category?: string }) {
  return prisma.program.findMany({
    where: {
      deletedAt: null,
      status: { in: PUBLIC_PROGRAM_STATUSES },
      ...(opts?.category ? { category: opts.category } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      creatorProfile: { select: { id: true, studioName: true } },
    },
  });
}

/** 공개 상세(/programs/[id]) — 존재하지 않거나 soft-delete면 null → 404 (FR-004, FR-011, AC-007). */
export function getProgramDetail(id: string) {
  return prisma.program.findFirst({
    where: { id, deletedAt: null },
    include: {
      creatorProfile: { select: { id: true, studioName: true, profileImageUrl: true } },
    },
  });
}

/** 크리에이터 본인 대시보드 목록 — DRAFT 포함, deletedAt IS NULL (FR-010, AC-008). */
export function listCreatorPrograms(creatorProfileId: string) {
  return prisma.program.findMany({
    where: { creatorProfileId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}
