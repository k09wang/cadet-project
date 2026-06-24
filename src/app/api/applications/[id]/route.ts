import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  cancelProgramApplication,
  removeProgramParticipant,
} from "@/lib/applications";
import { processSchema } from "@/lib/validation/application";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/applications/:id — 선착순 프로그램 신청 취소/멤버 제외.
 * 비로그인 401 → 검증실패 400 → 서비스 호출(403/404/400) → 200.
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

  const parsed = processSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id: applicationId } = await params;
  const serviceContext = { role: user.role, creatorProfileId: user.creatorProfile?.id };
  let result:
    | Awaited<ReturnType<typeof cancelProgramApplication>>
    | Awaited<ReturnType<typeof removeProgramParticipant>>;
  if (parsed.data.action === "cancel") {
    result = await cancelProgramApplication(applicationId, user.id);
  } else {
    result = await removeProgramParticipant(
      serviceContext,
      applicationId,
      parsed.data.removedReason,
    );
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 200 });
}
