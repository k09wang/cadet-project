// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { ApplyButton } from "@/components/programs/ApplyButton";

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

// 동의 체크 후 '신청 제출' 클릭 (신청 제출 전 약관 동의가 필수).
function submitForm() {
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "신청 제출" }));
}

describe("ApplyButton (FR-001, AC-001)", () => {
  it("모집 중이 아닌 경우 null을 렌더링한다", () => {
    const { container } = render(
      <ApplyButton programId="prog1" applied={false} recruiting={false} owner={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("본인 프로그램인 경우 null을 렌더링한다", () => {
    const { container } = render(
      <ApplyButton programId="prog1" applied={false} recruiting={true} owner={true} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("이미 신청한 경우 신청 완료 안내를 렌더링한다", () => {
    render(<ApplyButton programId="prog1" applied={true} recruiting={true} owner={false} />);
    expect(screen.getByText("신청 완료")).toBeTruthy();
  });

  it("신청 가능한 경우 폼을 렌더링한다", () => {
    render(<ApplyButton programId="prog1" applied={false} recruiting={true} owner={false} />);
    expect(screen.getByLabelText("신청 메시지")).toBeTruthy();
    expect(screen.getByRole("button", { name: "신청 제출" })).toBeTruthy();
  });

  it("약관 미동의 시 동의 안내를 표시하고 제출하지 않는다", () => {
    vi.clearAllMocks();
    render(<ApplyButton programId="prog1" applied={false} recruiting={true} owner={false} />);
    // 체크박스 없이 제출 버튼은 disabled
    expect(screen.getByRole("button", { name: "신청 제출" })).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("폼 제출 성공 시 성공 메시지를 표시하고 router.refresh를 호출한다", async () => {
    vi.clearAllMocks();

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "app1" }),
    });

    render(<ApplyButton programId="prog1" applied={false} recruiting={true} owner={false} />);
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("신청이 완료되었습니다.")).toBeTruthy();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("409 응답 시 '이미 신청했습니다' 에러를 표시한다", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: "Already applied" }),
    });

    render(<ApplyButton programId="prog1" applied={false} recruiting={true} owner={false} />);
    submitForm();

    await waitFor(() => {
      expect(screen.getByText(/이미 신청했습니다/)).toBeTruthy();
    });
  });

  it("400 응답 시 에러를 표시한다", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Cannot apply to own program" }),
    });

    render(<ApplyButton programId="prog1" applied={false} recruiting={true} owner={false} />);
    submitForm();

    await waitFor(() => {
      expect(screen.queryByText(/Cannot apply to own program/)).toBeTruthy();
    });
  });

  it("401 응답 시 로그인 필요 에러를 표시한다", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    render(<ApplyButton programId="prog1" applied={false} recruiting={true} owner={false} />);
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("로그인이 필요합니다.")).toBeTruthy();
    });
  });
});
