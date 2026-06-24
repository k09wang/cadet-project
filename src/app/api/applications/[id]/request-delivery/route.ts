import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requestDelivery } from "@/lib/reviews";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/applications/:id/request-delivery — 납품 요청 (SPEC-013 FR-001~FR-005, AC-001~AC-003).
 * 프로그램 소유 크리에이터가 결제 완료(PAID) 참여에 대해 납품을 요청한다.
 * 팬에게 DELIVERY_REQUESTED 알림. 멱등(이미 요청됐으면 기존 시각 반환).
 * 비로그인 401 → 서비스(400/403/404) → 200.
 */
export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await requestDelivery(
    { userId: user.id, role: user.role, creatorProfileId: user.creatorProfile?.id },
    id,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 200 });
}
