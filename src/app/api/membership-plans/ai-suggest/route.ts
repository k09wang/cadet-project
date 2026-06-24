import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { suggestMembership } from "@/lib/ai/suggest";

/**
 * POST /api/membership-plans/ai-suggest — 멤버십 AI 가격·혜택 추천 (SPEC-014 REQ-2-002).
 *
 * 권한 흐름: 비로그인 401 → 비크리에이터 403 → 입력검증 400 → 추천 200.
 * programs/ai-suggest/route.ts 패턴 동일 적용 (REQ-2-002).
 * 오류 시 Mock 폴백 반환, 예외·내부 정보 미노출 (REQ-2-005, NFR-002).
 *
 * @MX:ANCHOR: [AUTO] 멤버십 AI 추천 API — 크리에이터 전용 공개 API 경계
 * @MX:REASON: programs/ai-suggest와 동일한 권한 흐름 패턴 (REQ-2-002)
 */
const membershipAiSuggestInputSchema = z.object({
  description: z.string().min(1),
  category: z.string().optional(),
  targetAudience: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "CREATOR") {
    return NextResponse.json({ error: "Forbidden — creator only" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = membershipAiSuggestInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await suggestMembership(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 200 },
    );
  }
}
