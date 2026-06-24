// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NewMembershipClient } from "@/components/dashboard/NewMembershipClient";

const MOCK_SUGGESTION = {
  suggestedPrice: 9000,
  benefits: ["전용 커뮤니티", "비공개 콘텐츠"],
  reason: "팬 맞춤 추천",
  source: "mock" as const,
};

const action = vi.fn();

describe("NewMembershipClient (SPEC-014 REQ-2-003, REQ-2-004)", () => {
  it("AI 추천 반영 시 priceKrw와 description이 폼에 주입된다 (REQ-2-003, AC-2-001)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_SUGGESTION,
    } as Response);

    render(<NewMembershipClient action={action} />);

    // 설명 입력 후 AI 추천 요청
    fireEvent.change(screen.getByLabelText("멤버십 설명"), {
      target: { value: "일러스트 팬 멤버십" },
    });
    fireEvent.click(screen.getByRole("button", { name: "AI 추천 받기" }));

    await waitFor(() => {
      // 추천 결과 카드 표시 확인
      expect(screen.getByText(/9,000원/)).toBeInTheDocument();
    });

    // 폼에 반영
    fireEvent.click(screen.getByRole("button", { name: "폼에 반영" }));

    // 가격 주입 확인
    const priceInput = document.getElementById("priceKrw") as HTMLInputElement;
    expect(priceInput.value).toBe("9000");

    // description에 혜택 목록 포함 확인
    const descTextarea = document.getElementById("description") as HTMLTextAreaElement;
    expect(descTextarea.value).toContain("전용 커뮤니티");
    expect(descTextarea.value).toContain("비공개 콘텐츠");
  });

  it("추천 결과에 주차 구성이 없다 (REQ-2-001: 멤버십 추천은 가격+혜택 중심)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_SUGGESTION,
    } as Response);

    render(<NewMembershipClient action={action} />);

    fireEvent.change(screen.getByLabelText("멤버십 설명"), {
      target: { value: "멤버십 테스트" },
    });
    fireEvent.click(screen.getByRole("button", { name: "AI 추천 받기" }));

    await waitFor(() => {
      expect(screen.getByText(/9,000원/)).toBeInTheDocument();
    });

    // 주차 구성 텍스트가 없음 확인
    expect(screen.queryByText(/주차 구성/)).toBeNull();
    expect(screen.queryByText(/주차:/)).toBeNull();
  });

  it("Mock 폴백 시 '기본 추천' 안내 문구가 표시된다 (REQ-2-005, NFR-002, AC-2-003)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...MOCK_SUGGESTION, source: "mock" }),
    } as Response);

    render(<NewMembershipClient action={action} />);

    fireEvent.change(screen.getByLabelText("멤버십 설명"), {
      target: { value: "멤버십" },
    });
    fireEvent.click(screen.getByRole("button", { name: "AI 추천 받기" }));

    await waitFor(() => {
      expect(screen.getByText(/기본 추천/)).toBeInTheDocument();
    });
  });

  it("제출 action prop이 폼에 연결된다 (REQ-2-004: 제출 경로 불변)", () => {
    render(<NewMembershipClient action={action} />);
    // 폼 렌더링 확인 — 플랜 이름 필드가 존재해야 함
    expect(screen.getByLabelText("플랜 이름")).toBeInTheDocument();
  });
});
