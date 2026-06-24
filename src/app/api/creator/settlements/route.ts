import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listCreatorSettlements } from "@/lib/queries/contracts";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "CREATOR" || !user.creatorProfile) {
    return NextResponse.json({ error: "Forbidden: CREATOR role required" }, { status: 403 });
  }

  const settlements = await listCreatorSettlements(user.creatorProfile.id);
  return NextResponse.json({ settlements }, { status: 200 });
}
