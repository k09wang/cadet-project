import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { membershipPlanUpdateSchema } from "@/lib/validation/membership";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/membership-plans/:id — 플랜 수정 (SPEC-014 REQ-1-005, REQ-1-006).
 * 비로그인 401 → 비크리에이터·타인 403 → 검증실패 400 → 200.
 *
 * @MX:ANCHOR: [AUTO] 멤버십 플랜 수정 API — 본인 소유 검증 경계
 * @MX:REASON: 비소유 크리에이터 차단 패턴 (programs/[id]/route.ts 참고)
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "CREATOR" || !user.creatorProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = membershipPlanUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id } = await params;

  // 본인 소유 검증
  const plan = await prisma.membershipPlan.findUnique({ where: { id } });
  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (plan.creatorProfileId !== user.creatorProfile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.membershipPlan.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(updated, { status: 200 });
}

/**
 * DELETE /api/membership-plans/:id — 플랜 삭제 (SPEC-014 REQ-1-007, REQ-1-008).
 * 비로그인 401 → 비크리에이터·타인 403 → 활성 멤버 보유 시 409 → 성공 200.
 *
 * @MX:WARN: [AUTO] 활성 멤버 보유 판정 — prisma.membership.count로 서버 검증 필수 (NFR-003)
 * @MX:REASON: 클라이언트 버튼 비활성만으로는 불충분; 서버 판정이 보안 요구사항
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "CREATOR" || !user.creatorProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // 본인 소유 검증
  const plan = await prisma.membershipPlan.findUnique({ where: { id } });
  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (plan.creatorProfileId !== user.creatorProfile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 활성 멤버 보유 시 삭제 차단 (확정 결정 #1)
  const activeMemberCount = await prisma.membership.count({ where: { planId: id } });
  if (activeMemberCount > 0) {
    return NextResponse.json(
      { error: "활성 멤버가 있는 플랜은 삭제할 수 없습니다." },
      { status: 409 },
    );
  }

  await prisma.membershipPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
