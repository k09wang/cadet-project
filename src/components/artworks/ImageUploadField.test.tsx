// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ImageUploadField } from "@/components/artworks/ImageUploadField";

vi.mock("lucide-react", () => ({
  Upload: () => <span data-testid="upload-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:preview"),
    revokeObjectURL: vi.fn(),
  });
});

describe("ImageUploadField", () => {
  it("기본 이미지가 있으면 미리보기와 hidden 값을 렌더링한다", () => {
    render(<ImageUploadField name="imageUrl" label="작품 이미지" defaultValue="/uploads/art.png" />);

    const hidden = document.querySelector('input[name="imageUrl"]') as HTMLInputElement;
    expect(hidden.value).toBe("/uploads/art.png");
    expect(screen.getByLabelText("작품 이미지 미리보기")).toHaveStyle({
      backgroundImage: 'url("/uploads/art.png")',
    });
  });

  it("파일 업로드 성공 시 반환 URL을 hidden 값에 반영한다", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: "/uploads/creator-assets/new.png" }),
    });
    render(<ImageUploadField name="imageUrl" label="작품 이미지" />);

    const file = new File(["image"], "new.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/creator/uploads",
        expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
      );
      const hidden = document.querySelector('input[name="imageUrl"]') as HTMLInputElement;
      expect(hidden.value).toBe("/uploads/creator-assets/new.png");
    });
  });

  it("제거 버튼은 hidden 값을 비운다", () => {
    render(<ImageUploadField name="imageUrl" label="작품 이미지" defaultValue="/uploads/art.png" />);

    fireEvent.click(screen.getByRole("button", { name: "제거" }));

    const hidden = document.querySelector('input[name="imageUrl"]') as HTMLInputElement;
    expect(hidden.value).toBe("");
  });
});
