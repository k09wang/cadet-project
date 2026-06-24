import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveArtworkOrderIssue } from "@/lib/artwork-fulfillment";
import { resolveArtworkIssueSchema } from "@/lib/validation/artwork-order";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
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

  const parsed = resolveArtworkIssueSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id: orderId } = await params;
  const result = await resolveArtworkOrderIssue(
    { userId: user.id, role: user.role, creatorProfileId: user.creatorProfile?.id },
    orderId,
    parsed.data,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 200 });
}
