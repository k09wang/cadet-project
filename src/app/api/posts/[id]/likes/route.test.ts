import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPostFindUnique, mockLikeFindUnique, mockLikeCreate, mockLikeDelete } = vi.hoisted(() => ({
  mockPostFindUnique: vi.fn(),
  mockLikeFindUnique: vi.fn(),
  mockLikeCreate: vi.fn(),
  mockLikeDelete: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: { findUnique: (...args: unknown[]) => mockPostFindUnique(...args) },
    postLike: {
      findUnique: (...args: unknown[]) => mockLikeFindUnique(...args),
      create: (...args: unknown[]) => mockLikeCreate(...args),
      delete: (...args: unknown[]) => mockLikeDelete(...args),
    },
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

import { POST } from "@/app/api/posts/[id]/likes/route";

const FAN_USER = { id: "u-fan", role: "FAN", creatorProfile: null };
const POST_ROW = { id: "post-1", creatorProfileId: "p-1", visibility: "PUBLIC", status: "PUBLISHED" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/posts/[id]/likes", () => {
  it("비로그인 시 401을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(new Request("http://localhost/api/posts/post-1/likes", { method: "POST" }), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(res.status).toBe(401);
  });

  it("열람 권한이 없으면 403을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    mockPostFindUnique.mockResolvedValue(POST_ROW);
    mockCanViewPost.mockResolvedValue(false);

    const res = await POST(new Request("http://localhost/api/posts/post-1/likes", { method: "POST" }), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(res.status).toBe(403);
  });

  it("기존 좋아요가 없으면 좋아요를 생성한다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    mockPostFindUnique.mockResolvedValue(POST_ROW);
    mockCanViewPost.mockResolvedValue(true);
    mockLikeFindUnique.mockResolvedValue(null);
    mockLikeCreate.mockResolvedValue({ id: "like-1" });

    const res = await POST(new Request("http://localhost/api/posts/post-1/likes", { method: "POST" }), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(res.status).toBe(200);
    expect(mockLikeCreate).toHaveBeenCalledWith({
      data: { postId: "post-1", userId: "u-fan" },
    });
    expect(await res.json()).toEqual({ liked: true });
  });

  it("기존 좋아요가 있으면 취소한다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN_USER);
    mockPostFindUnique.mockResolvedValue(POST_ROW);
    mockCanViewPost.mockResolvedValue(true);
    mockLikeFindUnique.mockResolvedValue({ id: "like-1" });

    const res = await POST(new Request("http://localhost/api/posts/post-1/likes", { method: "POST" }), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(res.status).toBe(200);
    expect(mockLikeDelete).toHaveBeenCalledWith({ where: { id: "like-1" } });
    expect(await res.json()).toEqual({ liked: false });
  });
});
