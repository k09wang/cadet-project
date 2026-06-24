import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canViewPost } from "@/lib/post-access";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      creatorProfileId: true,
      visibility: true,
      status: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (post.status === "DRAFT" && user.creatorProfile?.id !== post.creatorProfileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await canViewPost(user, post);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.postLike.findUnique({
    where: {
      postId_userId: {
        postId: id,
        userId: user.id,
      },
    },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false }, { status: 200 });
  }

  await prisma.postLike.create({
    data: {
      postId: id,
      userId: user.id,
    },
  });
  return NextResponse.json({ liked: true }, { status: 200 });
}
