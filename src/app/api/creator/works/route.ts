import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creatorWorkCreateSchema } from "@/lib/validation/artwork";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "CREATOR" || !user.creatorProfile) {
    return NextResponse.json({ error: "Forbidden: CREATOR role required" }, { status: 403 });
  }

  const works = await prisma.creatorWork.findMany({
    where: { creatorProfileId: user.creatorProfile.id },
    orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(works, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "CREATOR" || !user.creatorProfile) {
    return NextResponse.json({ error: "Forbidden: CREATOR role required" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = creatorWorkCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const work = await prisma.creatorWork.create({
    data: {
      creatorProfileId: user.creatorProfile.id,
      ...parsed.data,
    },
  });
  return NextResponse.json(work, { status: 201 });
}
