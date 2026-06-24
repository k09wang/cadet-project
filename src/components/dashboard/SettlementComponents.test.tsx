// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { SettlementStatusBadge } from "@/components/dashboard/SettlementStatusBadge";
import { SettlementSummary } from "@/components/dashboard/SettlementSummary";
import { SettlementListItem } from "@/components/dashboard/SettlementListItem";

describe("Settlement dashboard components", () => {
  it("정산 상태 배지를 렌더링한다", () => {
    render(<SettlementStatusBadge status="approvable" />);
    expect(screen.getByText("정산 가능")).toBeTruthy();
  });

  it("정산 요약 금액과 건수를 렌더링한다", () => {
    render(
      <SettlementSummary
        totalAmount={2400000}
        totalCount={8}
        pendingAmount={800000}
        pendingCount={3}
        settledAmount={1600000}
        settledCount={5}
      />,
    );

    expect(screen.getByText("₩2,400,000")).toBeTruthy();
    expect(screen.getByText("3건 대기 중")).toBeTruthy();
    expect(screen.getByText("5건 완료")).toBeTruthy();
  });

  it("빈 정산 요약 상태를 렌더링한다", () => {
    render(
      <SettlementSummary
        totalAmount={0}
        totalCount={0}
        pendingAmount={0}
        pendingCount={0}
        settledAmount={0}
        settledCount={0}
      />,
    );

    expect(screen.getByText("정산 내역이 없습니다.")).toBeTruthy();
  });

  it("정산 리스트 액션을 호출한다", () => {
    const onAction = vi.fn();
    render(
      <SettlementListItem
        programTitle="봄 사진 클래스"
        participantName="김민준"
        amount={150000}
        status="pending"
        actionLabel="완료 승인"
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "완료 승인" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
