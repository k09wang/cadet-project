import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { approveCompletion } from "@/lib/reviews";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/applications/:id/approve-completion — 에스크로 완료 승인 (SPEC-013 FR-006~FR-011, AC-004~AC-008).
 * 해당 참여의 지불자(팬)만. 납품 요청 선행 필수. 단일 트랜잭션으로:
 * Payment/Settlement RELEASED + completionApprovedAt + 모든 결제 완료 참여 승인 시 Program COMPLETED.
 * 크리에이터에게 COMPLETION_APPROVED, 양측에게 MUTUAL_REVIEW_REQUESTED 알림.
 * 비로그인 401 → 서비스(400/403/404/500) → 200.
 */
export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await approveCompletion(
    { userId: user.id, role: user.role, creatorProfileId: user.creatorProfile?.id },
    id,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 200 });
}
