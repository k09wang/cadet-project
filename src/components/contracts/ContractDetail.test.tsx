// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContractDetail, type ContractDetailProps } from "@/components/contracts/ContractDetail";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: vi.fn() }),
}));

const AGREED = { proposed: true, agreed: true, rejected: false };

const baseProps: ContractDetailProps = {
  contractId: "c1",
  programTitle: "데모 프로그램",
  basePrice: 35000,
  proposedAmount: 35000,
  feeKrw: 3500,
  payout: 31500,
  agreementText: "약관 본문",
  fanName: "데모 팬",
  creatorName: "데모 스튜디오",
  amountState: AGREED,
  fanSigned: false,
  creatorSigned: false,
  paid: false,
  viewer: "fan",
};

beforeEach(() => {
  mockRefresh.mockReset();
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
});
afterEach(() => vi.clearAllMocks());

describe("ContractDetail (SPEC-006/011/012)", () => {
  it("프로그램명/금액/약관을 표시한다 (AC-001)", () => {
    render(<ContractDetail {...baseProps} />);
    expect(screen.getByText("데모 프로그램")).toBeTruthy();
    expect(screen.getByText("₩35,000")).toBeTruthy();
    expect(screen.getByText("약관 본문")).toBeTruthy();
  });

  it("양측 서명 전에는 결제 버튼이 비활성이다 (FR-005, AC-003)", () => {
    render(<ContractDetail {...baseProps} fanSigned={false} creatorSigned={false} />);
    const payBtn = screen.getByRole("button", { name: "결제하기" });
    expect((payBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("체크박스 동의 후 팬 서명 버튼이 활성화되고 sign API를 호출한다 (AC-003)", async () => {
    render(<ContractDetail {...baseProps} />);
    const signBtn = screen.getByRole("button", { name: "동의하고 서명" });
    expect((signBtn as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("checkbox"));
    expect((signBtn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(signBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/contracts/c1/sign",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("양측 서명 완료 시 결제 버튼이 활성화되고 payment API를 호출한다 (AC-004)", async () => {
    render(<ContractDetail {...baseProps} fanSigned={true} creatorSigned={true} />);
    const payBtn = screen.getByRole("button", { name: "결제하기" });
    expect((payBtn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(payBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/contracts/c1/payment",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("크리에이터는 금액 제안/서명 UI를 가지며 결제 버튼은 없다 (FR-012)", () => {
    render(<ContractDetail {...baseProps} viewer="creator" amountState={{ proposed: false, agreed: false, rejected: false }} />);
    expect(screen.getByRole("button", { name: "금액 제안" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "결제하기" })).toBeNull();
    expect(screen.getByText(/결제는 참여자\(팬\)가 진행합니다/)).toBeTruthy();
  });

  it("결제 완료 시 성공 카드(수수료/정산액)를 표시한다 (FR-010, AC-004)", () => {
    render(<ContractDetail {...baseProps} paid={true} />);
    expect(screen.getByText("결제가 완료되었습니다")).toBeTruthy();
    expect(screen.getByText("₩3,500")).toBeTruthy();
    expect(screen.getByText("₩31,500")).toBeTruthy();
  });
});
