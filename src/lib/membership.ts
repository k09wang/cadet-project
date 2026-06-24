import { prisma } from "@/lib/prisma";

/**
 * 팬이 해당 크리에이터의 활성 멤버인지 확인한다 (SPEC-003 FR-007, AC-008).
 * Membership 레코드 존재 여부로 활성 상태를 판단 (스키마에 status 필드 없음).
 *
 * @MX:ANCHOR: [AUTO] 멤버십 접근 제어의 핵심 판정 함수 — 여러 곳에서 호출됨
 * @MX:REASON: post-access, API 라우트, 서버 액션에서 fan_in >= 3으로 사용
 */
export async function isActiveMember(
  userId: string,
  creatorProfileId: string,
): Promise<boolean> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      plan: { creatorProfileId },
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  return membership !== null;
}

export type MembershipServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400 | 403 | 404 | 500; error: string };

export async function cancelMembership(
  userId: string,
  membershipId: string,
): Promise<MembershipServiceResult<{ id: string; status: string; cancelledAt: Date | null }>> {
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    select: { id: true, userId: true, status: true },
  });
  if (!membership) {
    return { ok: false, status: 404, error: "Membership not found" };
  }
  if (membership.userId !== userId) {
    return { ok: false, status: 403, error: "Forbidden: not your membership" };
  }
  if (membership.status !== "ACTIVE") {
    return { ok: false, status: 400, error: "Membership is not active" };
  }

  try {
    const cancelled = await prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
      select: { id: true, status: true, cancelledAt: true },
    });
    return { ok: true, data: cancelled };
  } catch {
    return { ok: false, status: 500, error: "Membership cancellation failed" };
  }
}
