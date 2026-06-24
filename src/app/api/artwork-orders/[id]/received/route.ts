import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markArtworkOrderReceived } from "@/lib/artwork-fulfillment";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;
  const result = await markArtworkOrderReceived(
    { userId: user.id, role: user.role, creatorProfileId: user.creatorProfile?.id },
    orderId,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 200 });
}
