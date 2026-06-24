// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CommentItem } from "@/components/community/CommentItem";

describe("CommentItem", () => {
  it("renders author, body, like count and reply action", () => {
    render(
      <CommentItem
        authorName="이서연"
        body="이번 주차 과제 정말 유익했어요."
        createdAt={new Date("2026-01-01T01:00:00Z")}
        likes={3}
      />,
    );

    expect(screen.getByText("이서연")).toBeTruthy();
    expect(screen.getByText("이번 주차 과제 정말 유익했어요.")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByRole("button", { name: "답글" })).toBeTruthy();
  });
});
