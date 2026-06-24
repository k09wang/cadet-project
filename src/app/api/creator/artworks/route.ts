import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { artworkCreateSchema } from "@/lib/validation/artwork";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "CREATOR" || !user.creatorProfile) {
    return NextResponse.json({ error: "Forbidden: CREATOR role required" }, { status: 403 });
  }

  const artworks = await prisma.artwork.findMany({
    where: { creatorProfileId: user.creatorProfile.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(artworks, { status: 200 });
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

  const parsed = artworkCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const artwork = await prisma.artwork.create({
    data: {
      creatorProfileId: user.creatorProfile.id,
      ...parsed.data,
    },
  });
  return NextResponse.json(artwork, { status: 201 });
}
