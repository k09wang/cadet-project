// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostDetail } from "@/components/posts/PostDetail";

describe("PostDetail (FR-010, AC-004)", () => {
  const post = {
    id: "p-1",
    title: "공개 포스트",
    body: "전체 본문 내용입니다.",
    visibility: "PUBLIC",
    likesCount: 2,
    viewerHasLiked: true,
    comments: [
      {
        id: "c-1",
        body: "좋은 포스트네요",
        createdAt: "2026-06-25T00:00:00.000Z",
        author: { name: "팬1" },
        _count: { likes: 1 },
      },
    ],
  };

  it("title과 body를 모두 렌더링한다", () => {
    render(<PostDetail post={post} />);
    expect(screen.getByText("공개 포스트")).toBeTruthy();
    expect(screen.getByText("전체 본문 내용입니다.")).toBeTruthy();
  });

  it("좋아요와 댓글 수, 댓글 목록을 렌더링한다", () => {
    render(<PostDetail post={post} currentUser={{ id: "fan-1", name: "팬", role: "FAN" }} />);
    expect(screen.getByRole("button", { name: /좋아요 2/ })).toBeTruthy();
    expect(screen.getByText("댓글 1")).toBeTruthy();
    expect(screen.getByText("좋은 포스트네요")).toBeTruthy();
  });

  it("로그인 사용자는 댓글 입력창을 본다", () => {
    render(<PostDetail post={post} currentUser={{ id: "fan-1", name: "팬", role: "FAN" }} />);
    expect(screen.getByPlaceholderText("댓글을 남겨보세요")).toBeTruthy();
  });
});
