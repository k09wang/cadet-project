import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rejectAmount } from "@/lib/contracts";
import { amountRejectSchema } from "@/lib/validation/contract";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/contracts/:id/amount/reject — 합의 금액 거부/결렬 (SPEC-011 FR-007~FR-010, AC-006~AC-008).
 * 팬 본인만. 단일 트랜잭션으로 신청 REJECTED + 프로그램 RECRUITING 복귀 + 결렬 알림.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = amountRejectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "agreed must be false", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id: contractId } = await params;
  const result = await rejectAmount(
    { userId: user.id, role: user.role, creatorProfileId: user.creatorProfile?.id },
    contractId,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 200 });
}
