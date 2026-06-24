import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { signContractAsCreator } from "@/lib/contracts";
import { signSchema } from "@/lib/validation/contract";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/contracts/:id/sign/creator — 크리에이터 서명 (SPEC-011 FR-012/FR-013/FR-015, AC-010/AC-011).
 * 프로그램 소유 크리에이터만. 비로그인 401 → 검증실패 400 → 서비스(403/404) → 200.
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

  const parsed = signSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Agreement is required to sign", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id: contractId } = await params;
  const result = await signContractAsCreator(
    { userId: user.id, role: user.role, creatorProfileId: user.creatorProfile?.id },
    contractId,
    parsed.data.agreed,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 200 });
}
