import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    program: {
      findMany: (...a: unknown[]) => mockFindMany(...a),
      findFirst: (...a: unknown[]) => mockFindFirst(...a),
    },
  },
}));

import { getProgramDetail, listCreatorPrograms, listPublicPrograms } from "@/lib/queries/programs";

beforeEach(() => {
  mockFindMany.mockReset();
  mockFindFirst.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("listPublicPrograms (FR-003, NFR-004)", () => {
  it("deletedAt:null + 공개 상태 필터로 조회한다", async () => {
    mockFindMany.mockResolvedValue([]);
    await listPublicPrograms();
    const arg = mockFindMany.mock.calls[0][0];
    expect(arg.where.deletedAt).toBeNull();
    expect(arg.where.status.in).toContain("RECRUITING");
    expect(arg.where.status.in).not.toContain("DRAFT");
  });

  it("category 옵션이 있으면 where에 포함한다", async () => {
    mockFindMany.mockResolvedValue([]);
    await listPublicPrograms({ category: "클래스" });
    expect(mockFindMany.mock.calls[0][0].where.category).toBe("클래스");
  });
});

describe("getProgramDetail (FR-004, FR-011, AC-007)", () => {
  it("deletedAt:null 조건으로 단건 조회한다", async () => {
    mockFindFirst.mockResolvedValue(null);
    await getProgramDetail("p1");
    expect(mockFindFirst.mock.calls[0][0].where).toMatchObject({ id: "p1", deletedAt: null });
  });
});

describe("listCreatorPrograms (FR-010, AC-008)", () => {
  it("본인 프로필 전체 프로그램(DRAFT 포함, deletedAt:null)을 조회한다", async () => {
    mockFindMany.mockResolvedValue([]);
    await listCreatorPrograms("p-A");
    const arg = mockFindMany.mock.calls[0][0];
    expect(arg.where).toMatchObject({ creatorProfileId: "p-A", deletedAt: null });
    expect(arg.where.status).toBeUndefined();
  });
});
