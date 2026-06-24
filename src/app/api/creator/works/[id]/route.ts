import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creatorWorkUpdateSchema } from "@/lib/validation/artwork";

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

  const parsed = creatorWorkUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const work = await prisma.creatorWork.findUnique({
    where: { id },
    select: { id: true, creatorProfileId: true },
  });
  if (!work) {
    return NextResponse.json({ error: "Creator work not found" }, { status: 404 });
  }
  if (work.creatorProfileId !== auth.creatorProfileId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.creatorWork.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireCreator();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const work = await prisma.creatorWork.findUnique({
    where: { id },
    select: { id: true, creatorProfileId: true },
  });
  if (!work) {
    return NextResponse.json({ error: "Creator work not found" }, { status: 404 });
  }
  if (work.creatorProfileId !== auth.creatorProfileId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.creatorWork.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true }, { status: 200 });
}
