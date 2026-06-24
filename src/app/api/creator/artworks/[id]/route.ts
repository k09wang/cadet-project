import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { artworkUpdateSchema } from "@/lib/validation/artwork";

type RouteContext = { params: Promise<{ id: string }> };

async function requireCreator() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "CREATOR" || !user.creatorProfile) {
    return { error: NextResponse.json({ error: "Forbidden: CREATOR role required" }, { status: 403 }) };
  }
  return { user, creatorProfileId: user.creatorProfile.id };
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireCreator();
  if (auth.error) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = artworkUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { id: true, creatorProfileId: true },
  });
  if (!artwork) {
    return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
  }
  if (artwork.creatorProfileId !== auth.creatorProfileId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.artwork.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireCreator();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const artwork = await prisma.artwork.findUnique({
    where: { id },
    select: { id: true, creatorProfileId: true },
  });
  if (!artwork) {
    return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
  }
  if (artwork.creatorProfileId !== auth.creatorProfileId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orderCount = await prisma.artworkOrder.count({ where: { artworkId: id } });
  if (orderCount > 0) {
    const hidden = await prisma.artwork.update({
      where: { id },
      data: { status: "HIDDEN" },
    });
    return NextResponse.json({ ok: true, deleted: false, hidden: true, artwork: hidden }, { status: 200 });
  }

  await prisma.artwork.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true, hidden: false }, { status: 200 });
}
