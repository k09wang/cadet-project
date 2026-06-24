// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ArtworkForm, CreatorWorkForm } from "@/components/artworks/CreatorAssetForms";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("lucide-react", () => ({
  Upload: () => <span data-testid="upload-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CreatorWorkForm", () => {
  it("작업명이 없으면 API 호출 없이 필수 입력 안내를 표시한다", async () => {
    render(<CreatorWorkForm />);

    fireEvent.submit(screen.getByRole("button", { name: "작업물 등록" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("작업명을 입력해주세요.")).toBeTruthy();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("작업명이 있으면 작업물 생성 API를 호출한다", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });
    render(<CreatorWorkForm />);

    fireEvent.change(screen.getByPlaceholderText("작업명"), { target: { value: "개인전 기록" } });
    fireEvent.submit(screen.getByRole("button", { name: "작업물 등록" }).closest("form")!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/creator/works",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            title: "개인전 기록",
          }),
        }),
      );
    });
    expect(mockRefresh).toHaveBeenCalled();
  });
});

describe("ArtworkForm", () => {
  it("판매 가격이 없으면 API 호출 없이 필수 입력 안내를 표시한다", async () => {
    render(<ArtworkForm />);

    fireEvent.change(screen.getByPlaceholderText("작품명"), { target: { value: "원화" } });
    fireEvent.submit(screen.getByRole("button", { name: "작품 등록" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("판매 가격을 1원 이상으로 입력해주세요.")).toBeTruthy();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
