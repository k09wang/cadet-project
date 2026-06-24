import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canViewPost } from "@/lib/post-access";
import { postCommentCreateSchema } from "@/lib/validation/post";

export async function POST(
  request: Request,
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

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = postCommentCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const comment = await prisma.postComment.create({
    data: {
      postId: id,
      authorId: user.id,
      body: parsed.data.body,
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
