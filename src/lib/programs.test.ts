import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockNotifyProgramClosed = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    program: {
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      create: (...a: unknown[]) => mockCreate(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
    },
  },
}));
vi.mock("@/lib/applications", () => ({
  notifyProgramClosed: (...a: unknown[]) => mockNotifyProgramClosed(...a),
}));

import { createProgram, deleteProgram, updateProgram } from "@/lib/programs";

const CREATOR = { role: "CREATOR", creatorProfileId: "p-A" };
const FAN = { role: "FAN", creatorProfileId: null };

beforeEach(() => {
  mockFindUnique.mockReset();
  mockCreate.mockReset();
  mockUpdate.mockReset();
  mockNotifyProgramClosed.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("createProgram (FR-001, FR-002, AC-001, AC-004)", () => {
  it("FAN이면 403", async () => {
    const r = await createProgram(FAN, { title: "x", priceKrw: 1000 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("크리에이터는 본인 프로필에 연결해 생성하고 기본 status는 RECRUITING", async () => {
    mockCreate.mockResolvedValue({ id: "prog-1" });
    const r = await createProgram(CREATOR, { title: "4주 챌린지", priceKrw: 35000, maxParticipants: 20 });
    expect(r.ok).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ creatorProfileId: "p-A", status: "RECRUITING", priceKrw: 35000 }),
    });
  });
});

describe("updateProgram (FR-006, FR-007, AC-005, AC-009, AC-010)", () => {
  it("존재하지 않으면 404", async () => {
    mockFindUnique.mockResolvedValue(null);
    const r = await updateProgram(CREATOR, "nope", { title: "수정" });
    if (!r.ok) expect(r.status).toBe(404);
  });

  it("soft-deleted면 404", async () => {
    mockFindUnique.mockResolvedValue({ id: "p1", creatorProfileId: "p-A", status: "RECRUITING", deletedAt: new Date() });
    const r = await updateProgram(CREATOR, "p1", { title: "수정" });
    if (!r.ok) expect(r.status).toBe(404);
  });

  it("타 크리에이터의 프로그램 수정은 403 (AC-010)", async () => {
    mockFindUnique.mockResolvedValue({ id: "p1", creatorProfileId: "p-B", status: "RECRUITING", deletedAt: null });
    const r = await updateProgram(CREATOR, "p1", { title: "수정" });
    if (!r.ok) expect(r.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("모집 마감일이 과거면 CLOSED 상태를 자동 저장한다", async () => {
    mockFindUnique.mockResolvedValue({ id: "p1", creatorProfileId: "p-A", status: "RECRUITING", deletedAt: null });
    mockUpdate.mockResolvedValue({ id: "p1", status: "CLOSED" });
    mockNotifyProgramClosed.mockResolvedValue(undefined);
    const recruitDeadline = new Date("2000-01-01T00:00:00Z");
    const r = await updateProgram(CREATOR, "p1", { recruitDeadline });
    expect(r.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { recruitDeadline, status: "CLOSED" },
    });
    expect(mockNotifyProgramClosed).toHaveBeenCalledWith("p1");
  });

  it("시작일이 지났으면 IN_PROGRESS 상태를 자동 저장한다", async () => {
    mockFindUnique.mockResolvedValue({ id: "p1", creatorProfileId: "p-A", status: "RECRUITING", deletedAt: null });
    mockUpdate.mockResolvedValue({ id: "p1", status: "IN_PROGRESS" });
    const startDate = new Date("2000-01-01T00:00:00Z");
    const endDate = new Date("2999-01-01T00:00:00Z");
    const r = await updateProgram(CREATOR, "p1", { startDate, endDate });
    expect(r.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { startDate, endDate, status: "IN_PROGRESS" },
    });
    expect(mockNotifyProgramClosed).not.toHaveBeenCalled();
  });

  it("상태가 바뀌지 않으면 입력 필드만 갱신한다", async () => {
    mockFindUnique.mockResolvedValue({ id: "p1", creatorProfileId: "p-A", status: "CLOSED", deletedAt: null });
    mockUpdate.mockResolvedValue({ id: "p1", status: "CLOSED" });
    const r = await updateProgram(CREATOR, "p1", { title: "새 제목" });
    expect(r.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: "p1" }, data: { title: "새 제목" } });
    expect(mockNotifyProgramClosed).not.toHaveBeenCalled();
  });

  it("알림 실패해도 업데이트는 성공 (best-effort)", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFindUnique.mockResolvedValue({ id: "p1", creatorProfileId: "p-A", status: "RECRUITING", deletedAt: null });
    mockUpdate.mockResolvedValue({ id: "p1", status: "CLOSED" });
    mockNotifyProgramClosed.mockRejectedValue(new Error("Notification failed"));
    const r = await updateProgram(CREATOR, "p1", { recruitDeadline: new Date("2000-01-01T00:00:00Z") });
    expect(r.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("deleteProgram (FR-008, AC-007)", () => {
  it("타인 프로그램 삭제는 403", async () => {
    mockFindUnique.mockResolvedValue({ id: "p1", creatorProfileId: "p-B", status: "RECRUITING", deletedAt: null });
    const r = await deleteProgram(CREATOR, "p1");
    if (!r.ok) expect(r.status).toBe(403);
  });

  it("본인 프로그램은 deletedAt만 설정한다 (물리 삭제 금지)", async () => {
    mockFindUnique.mockResolvedValue({ id: "p1", creatorProfileId: "p-A", status: "RECRUITING", deletedAt: null });
    mockUpdate.mockResolvedValue({ id: "p1", deletedAt: new Date() });
    const r = await deleteProgram(CREATOR, "p1");
    expect(r.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
