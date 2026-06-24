import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { verifyPayment } from "@/lib/contracts";
import { paymentCallbackSchema } from "@/lib/validation/contract";

/**
 * POST /api/payments/callback — PG 결제 검증/확정 (SPEC-012 FR-011~FR-015, AC-005~AC-008/AC-014).
 *
 * PG 결제창 종료 후 리다이렉트/콜백으로 { merchantUid, providerTxId }를 수신한다.
 * 서버가 PG 단건 조회 후 금액·주문번호·상태를 대조하고 성공 시에만 PAID 확정.
 * 비로그인 401 → 검증실패 400 → 서비스(400/403/404/500) → 200.
 */
export async function POST(request: Request) {
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

  const parsed = paymentCallbackSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await verifyPayment(
    { userId: user.id, role: user.role, creatorProfileId: user.creatorProfile?.id },
    parsed.data,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 200 });
}

/** GET 핸들러 — PG 리다이렉트 쿼리 파라미터 형태도 수용(merchantUid/imp_uid). */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const merchantUid = url.searchParams.get("merchantUid") ?? "";
  const providerTxId = url.searchParams.get("providerTxId") ?? url.searchParams.get("imp_uid") ?? "";

  const parsed = paymentCallbackSchema.safeParse({ merchantUid, providerTxId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await verifyPayment(
    { userId: user.id, role: user.role, creatorProfileId: user.creatorProfile?.id },
    parsed.data,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 200 });
}
