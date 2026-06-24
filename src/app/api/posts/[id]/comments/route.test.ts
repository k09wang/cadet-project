import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPostFindUnique, mockCommentCreate } = vi.hoisted(() => ({
  mockPostFindUnique: vi.fn(),
  mockCommentCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: { findUnique: (...args: unknown[]) => mockPostFindUnique(...args) },
    postComment: { create: (...args: unknown[]) => mockCommentCreate(...args) },
  },
}));

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

const mockCanViewPost = vi.fn();
vi.mock("@/lib/post-access", () => ({
  canViewPost: (...args: unknown[]) => mockCanViewPost(...args),
}));

import { POST } from "@/app/api/posts/[id]/comments/route";

const FAN_USER = { id: "u-fan", role: "FAN", creatorProfile: null };
const POST_ROW = { id: "post-1", creatorProfileId: "p-1", visibility: "PUBLIC", status: "PUBLISHED" };

function makeReq(body: unknown) {
  return new Request("http://localhost/api/posts/post-1/comments", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/posts/[id]/comments", () => {
  it("비로그인 시 401을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq({ body: "댓글" }), {
      params: Promise.resolve({ id: "post-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("열람 권한이 없으면 403을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    mockPostFindUnique.mockResolvedValue(POST_ROW);
    mockCanViewPost.mockResolvedValue(false);

    const res = await POST(makeReq({ body: "댓글" }), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(res.status).toBe(403);
  });

  it("유효한 댓글을 생성하고 201을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    mockPostFindUnique.mockResolvedValue(POST_ROW);
    mockCanViewPost.mockResolvedValue(true);
    mockCommentCreate.mockResolvedValue({
      id: "comment-1",
      body: "좋아요",
      createdAt: "2026-06-25T00:00:00.000Z",
      author: { name: "팬1" },
    });

    const res = await POST(makeReq({ body: "좋아요" }), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(res.status).toBe(201);
    expect(mockCommentCreate).toHaveBeenCalledWith({
      data: { postId: "post-1", authorId: "u-fan", body: "좋아요" },
      include: { author: { select: { name: true } } },
    });
  });
});
