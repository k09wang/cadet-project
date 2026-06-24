// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockListCreators = vi.fn();
const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/queries/studio", () => ({
  listCreators: (...args: unknown[]) => mockListCreators(...args),
}));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

import CreatorsPage from "@/app/(app)/creators/page";

beforeEach(() => {
  mockListCreators.mockReset();
  mockGetCurrentUser.mockReset();
  mockGetCurrentUser.mockResolvedValue(null);
});
afterEach(() => vi.clearAllMocks());

describe("/creators list page (AC-001)", () => {
  it("renders >=2 creator cards from seeded data", async () => {
    mockListCreators.mockResolvedValue([
      { id: "p-1", studioName: "스튜디오 1", bio: null, profileImageUrl: null, category: null },
      { id: "p-2", studioName: "스튜디오 2", bio: "작가2", profileImageUrl: null, category: "회화" },
    ]);
    const ui = await CreatorsPage({});
    render(ui);
    expect(screen.getByText("스튜디오 1")).toBeTruthy();
    expect(screen.getByText("스튜디오 2")).toBeTruthy();
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it("tab=artworks 진입 시 작품 구매 목록 제목과 작품 탭 링크를 렌더링한다", async () => {
    mockListCreators.mockResolvedValue([
      { id: "p-1", studioName: "스튜디오 1", bio: null, profileImageUrl: null, category: null },
    ]);
    const ui = await CreatorsPage({
      searchParams: Promise.resolve({ tab: "artworks" }),
    });
    render(ui);

    expect(screen.getByText("작품 구매 가능한 크리에이터")).toBeTruthy();
    expect(screen.getByRole("link", { name: /스튜디오 1/ })).toHaveAttribute(
      "href",
      "/creators/p-1?tab=artworks",
    );
  });
});
