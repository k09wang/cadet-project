import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { proposeAmount } from "@/lib/contracts";
import { amountProposeSchema } from "@/lib/validation/contract";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/contracts/:id/amount — 합의 금액 제시 (SPEC-011 FR-001~FR-003, AC-001~AC-003).
 * 프로그램 소유 크리에이터만. 비로그인 401 → 검증실패 400 → 서비스(403/404/409) → 200.
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

  const parsed = amountProposeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Amount must be a positive integer", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id: contractId } = await params;
  const result = await proposeAmount(
    { userId: user.id, role: user.role, creatorProfileId: user.creatorProfile?.id },
    contractId,
    parsed.data.amount,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 200 });
}
