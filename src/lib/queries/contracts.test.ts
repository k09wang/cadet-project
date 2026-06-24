import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    contract: { findUnique: vi.fn() },
    payment: { findMany: vi.fn(), findFirst: vi.fn() },
    programApplication: { findMany: vi.fn() },
    settlement: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  getContractDetail,
  getFanPaymentReceipt,
  listFanPayments,
  listFanAcceptedApplications,
  listCreatorSettlements,
} from "./contracts";

describe("queries/contracts (SPEC-006)", () => {
  beforeEach(() => {
    mockPrisma.contract.findUnique.mockReset();
    mockPrisma.payment.findMany.mockReset();
    mockPrisma.payment.findFirst.mockReset();
    mockPrisma.programApplication.findMany.mockReset();
    mockPrisma.settlement.findMany.mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it("getContractDetail은 contractId로 application/program/payments를 포함해 조회한다", () => {
    mockPrisma.contract.findUnique.mockReturnValue("contract");
    expect(getContractDetail("c1")).toBe("contract");
    const arg = mockPrisma.contract.findUnique.mock.calls[0][0];
    expect(arg.where).toEqual({ id: "c1" });
    expect(arg.include.application).toBeDefined();
    expect(arg.include.payments).toBeDefined();
  });

  it("listFanPayments는 팬의 모든 결제 원천을 최신순으로 조회한다", () => {
    mockPrisma.payment.findMany.mockReturnValue("payments");
    expect(listFanPayments("fan-1")).toBe("payments");
    const arg = mockPrisma.payment.findMany.mock.calls[0][0];
    expect(arg.where.fanUserId).toBe("fan-1");
    expect(arg.where.contractId).toBeUndefined();
    expect(arg.orderBy).toEqual({ createdAt: "desc" });
    expect(arg.include.membership).toBeDefined();
    expect(arg.include.post).toBeDefined();
    expect(arg.include.contract).toBeDefined();
    expect(arg.include.programApplication).toBeDefined();
    expect(arg.include.artworkOrder).toBeDefined();
  });

  it("getFanPaymentReceipt는 팬 본인 결제만 영수증용으로 조회한다", () => {
    mockPrisma.payment.findFirst.mockReturnValue("payment");
    expect(getFanPaymentReceipt("pay-1", "fan-1")).toBe("payment");
    const arg = mockPrisma.payment.findFirst.mock.calls[0][0];
    expect(arg.where).toEqual({ id: "pay-1", fanUserId: "fan-1" });
    expect(arg.include.fan).toBeDefined();
    expect(arg.include.membership).toBeDefined();
    expect(arg.include.programApplication).toBeDefined();
    expect(arg.include.artworkOrder).toBeDefined();
  });

  it("listFanAcceptedApplications는 팬의 프로그램 참여 진행 신청을 조회한다", () => {
    mockPrisma.programApplication.findMany.mockReturnValue("apps");
    expect(listFanAcceptedApplications("fan-1")).toBe("apps");
    const arg = mockPrisma.programApplication.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({
      userId: "fan-1",
      status: { in: ["RESERVED", "PENDING_PAYMENT", "ACCEPTED"] },
    });
    expect(arg.include.payment.select).toEqual({ id: true, status: true });
  });

  it("listCreatorSettlements는 크리에이터 본인 수익원 전체의 정산을 조회한다", () => {
    mockPrisma.settlement.findMany.mockReturnValue("settlements");
    expect(listCreatorSettlements("creator-profile-1")).toBe("settlements");
    const arg = mockPrisma.settlement.findMany.mock.calls[0][0];
    expect(arg.where.payment.OR).toEqual(
      expect.arrayContaining([
        { membership: { plan: { creatorProfileId: "creator-profile-1" } } },
        { post: { creatorProfileId: "creator-profile-1" } },
      ]),
    );
    expect(arg.include.payment.include.fan).toBeDefined();
    expect(arg.include.payment.include.membership).toBeDefined();
    expect(arg.include.payment.include.post).toBeDefined();
    expect(arg.include.payment.include.contract).toBeDefined();
    expect(arg.include.payment.include.programApplication).toBeDefined();
    expect(arg.include.payment.include.artworkOrder).toBeDefined();
  });
});
