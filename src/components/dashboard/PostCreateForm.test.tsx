// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PostCreateForm } from "@/components/dashboard/PostCreateForm";

describe("PostCreateForm (FR-012, FR-013)", () => {
  const mockAction = vi.fn();

  it("title, body, 공개 범위 세그먼티드 컨트롤을 렌더링한다", () => {
    render(<PostCreateForm action={mockAction} />);
    expect(screen.getByLabelText("제목")).toBeTruthy();
    expect(screen.getByLabelText("본문")).toBeTruthy();
    expect(screen.getByRole("button", { name: "전체 공개" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "멤버십 한정" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "유료" })).toBeTruthy();
  });

  it("기본 visibility는 PUBLIC이다", () => {
    render(<PostCreateForm action={mockAction} />);
    const publicTab = screen.getByRole("button", { name: "전체 공개" });
    expect(publicTab.getAttribute("aria-pressed")).toBe("true");
  });

  it("PAID 선택 시 priceKrw 입력 필드가 나타난다 (FR-013)", () => {
    render(<PostCreateForm action={mockAction} />);
    expect(screen.queryByLabelText("콘텐츠 가격 (원)")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "유료" }));
    expect(screen.getByLabelText("콘텐츠 가격 (원)")).toBeTruthy();
  });

  it("PUBLIC 선택 시 priceKrw 입력 필드가 없다", () => {
    render(<PostCreateForm action={mockAction} />);
    fireEvent.click(screen.getByRole("button", { name: "유료" }));
    fireEvent.click(screen.getByRole("button", { name: "전체 공개" }));
    expect(screen.queryByLabelText("콘텐츠 가격 (원)")).toBeNull();
  });
});
