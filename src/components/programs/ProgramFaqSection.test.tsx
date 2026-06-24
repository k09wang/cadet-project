// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgramFaqSection } from "@/components/programs/ProgramFaqSection";

describe("ProgramFaqSection", () => {
  it("유료 프로그램의 선착순 결제 안내와 일정 정보를 렌더링한다", () => {
    render(
      <ProgramFaqSection
        priceKrw={35000}
        startDate="2026-07-01"
        endDate="2026-07-28"
        recruitDeadline="2026-06-30"
        maxParticipants={12}
      />,
    );

    expect(screen.getByText("참여 전 FAQ")).toBeTruthy();
    expect(screen.getByText(/신청과 결제가 완료되면 바로 참여가 확정/)).toBeTruthy();
    expect(screen.getByText(/정원은 12명/)).toBeTruthy();
    expect(screen.getByText("결제 금액: ₩35,000")).toBeTruthy();
  });

  it("무료 프로그램은 별도 결제 없이 확정된다는 안내를 렌더링한다", () => {
    render(<ProgramFaqSection priceKrw={0} maxParticipants={null} />);

    expect(screen.getByText(/별도 결제 없이 바로 참여가 확정/)).toBeTruthy();
    expect(screen.getByText(/정원은 제한 없음/)).toBeTruthy();
  });
});
