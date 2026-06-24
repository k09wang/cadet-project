// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { ApplicationList } from "@/components/applications/ApplicationList";

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe("ApplicationList (FR-002, AC-003, AC-004)", () => {
  const mockApplications = [
    {
      id: "app1",
      userId: "user1",
      status: "PENDING",
      message: "참여하고 싶습니다",
      createdAt: "2026-01-15T10:00:00Z",
      user: { id: "user1", name: "김철수" },
    },
    {
      id: "app2",
      userId: "user2",
      status: "ACCEPTED",
      message: null,
      createdAt: "2026-01-14T10:00:00Z",
      user: { id: "user2", name: "이영희" },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("빈 목록일 경우 안내 메시지를 렌더링한다", () => {
    render(<ApplicationList programId="prog1" applications={[]} />);
    expect(screen.getByText("아직 신청이 없습니다.")).toBeTruthy();
  });

  it("신청 목록을 렌더링한다", () => {
    render(<ApplicationList programId="prog1" applications={mockApplications} />);

    expect(screen.getByText("김철수")).toBeTruthy();
    expect(screen.getByText("이영희")).toBeTruthy();
    expect(screen.getByText("신청 대기")).toBeTruthy();
    expect(screen.getByText("확정")).toBeTruthy();
  });

  it("PENDING 상태의 신청에는 심사 버튼을 렌더링하지 않는다", () => {
    render(<ApplicationList programId="prog1" applications={mockApplications} />);

    expect(screen.getByText("김철수")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "수락" })).toBeNull();
    expect(screen.queryByRole("button", { name: "거절" })).toBeNull();
  });

  it("ACCEPTED 상태의 신청에는 멤버 제외 액션을 렌더링한다", () => {
    render(<ApplicationList programId="prog1" applications={mockApplications} />);

    expect(screen.getByRole("button", { name: "멤버 제외" })).toBeTruthy();
  });

  it("멤버 제외 클릭 시 remove action을 전송한다", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "app2", status: "REMOVED" }),
    });

    render(<ApplicationList programId="prog1" applications={mockApplications} />);

    fireEvent.click(screen.getByRole("button", { name: "멤버 제외" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/applications/app2",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"action":"remove"'),
        }),
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
