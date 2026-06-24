// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ArtworkManagerCard } from "@/components/artworks/CreatorAssetManager";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("lucide-react", () => ({
  Eye: () => <span data-testid="eye-icon" />,
  EyeOff: () => <span data-testid="eye-off-icon" />,
  Pencil: () => <span data-testid="pencil-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Upload: () => <span data-testid="upload-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

global.fetch = vi.fn();

const BASE_ARTWORK = {
  id: "art-1",
  title: "원화",
  description: "종이에 과슈",
  imageUrl: null,
  priceKrw: 120000,
  stock: 2,
  status: "PUBLISHED" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("ArtworkManagerCard", () => {
  it("주문 이력이 있으면 삭제 시 숨김 처리 정책을 표시한다", () => {
    render(<ArtworkManagerCard artwork={{ ...BASE_ARTWORK, orderCount: 3 }} />);

    expect(screen.getByText("원화")).toBeTruthy();
    expect(screen.getByText("주문 3건 · 삭제 시 숨김 처리")).toBeTruthy();
  });

  it("주문 이력이 없는 작품은 삭제 가능 상태를 표시한다", () => {
    render(<ArtworkManagerCard artwork={{ ...BASE_ARTWORK, orderCount: 0 }} />);

    expect(screen.getByText("주문 0건 · 삭제 가능")).toBeTruthy();
  });

  it("주문 이력이 있는 작품 삭제 확인 문구에 숨김 처리를 안내한다", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, deleted: false, hidden: true }),
    });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<ArtworkManagerCard artwork={{ ...BASE_ARTWORK, orderCount: 2 }} />);
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));

    expect(confirmSpy).toHaveBeenCalledWith("주문 2건이 있어 삭제 대신 숨김 처리됩니다. 계속할까요?");
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/creator/artworks/art-1", { method: "DELETE" });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
