import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { agreeAmount } from "@/lib/contracts";
import { amountAgreeSchema } from "@/lib/validation/contract";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/contracts/:id/amount/agree — 합의 금액 동의 (SPEC-011 FR-004/FR-005).
 * 팬 본인만. 비로그인 401 → 검증실패 400 → 서비스(400/403/404) → 200.
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

  const parsed = amountAgreeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "agreed must be true", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id: contractId } = await params;
  const result = await agreeAmount(
    { userId: user.id, role: user.role, creatorProfileId: user.creatorProfile?.id },
    contractId,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 200 });
}
