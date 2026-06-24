import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock은 import보다 먼저 호이스팅되므로, factory가 참조하는 mockPrisma는
// vi.hoisted로 함께 호이스팅해야 TDZ(초기화 전 접근) 에러를 피한다.
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    program: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    programApplication: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      update: vi.fn(),
    },
    settlement: {
      create: vi.fn(),
      update: vi.fn(),
    },
    creatorProfile: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const mockFindActiveApplication = vi.fn();
vi.mock("@/lib/queries/applications", () => ({
  findActiveApplication: (...a: unknown[]) => mockFindActiveApplication(...a),
}));

const { mockProvider } = vi.hoisted(() => ({
  mockProvider: {
    name: "mock",
    createRequest: vi.fn(),
    charge: vi.fn(),
  },
}));
vi.mock("@/lib/payment/provider", () => ({
  resolvePaymentProvider: () => mockProvider,
}));

import {
  applyToProgram,
  cancelProgramApplication,
  processApplication,
  removeProgramParticipant,
  notifyProgramClosed,
  type ApplicationServiceContext,
} from "./applications";

const CREATOR_CTX: ApplicationServiceContext = {
  role: "CREATOR",
  creatorProfileId: "cp-1",
};
const FAN_CTX: ApplicationServiceContext = {
  role: "FAN",
  creatorProfileId: null,
};

describe("lib/applications (SPEC-005 FR-001~FR-009, FR-012, AC-001~AC-012)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본 transaction mock: 콜백을 즉시 실행
    mockPrisma.$transaction.mockImplementation(async (cb) => {
      return cb(mockPrisma);
    });
    mockPrisma.programApplication.count.mockResolvedValue(0);
    mockProvider.createRequest.mockReturnValue({
      merchantUid: "order-app-1",
      amount: 30000,
      productName: "program",
      provider: "mock",
      paymentParams: {},
    });
    mockProvider.charge.mockResolvedValue({
      success: true,
      provider: "mock",
      providerTxId: "mock-app-1",
      amount: 30000,
    });
  });
  afterEach(() => vi.clearAllMocks());

  describe("applyToProgram (FR-001~FR-004, AC-001~AC-004)", () => {
    it("CREATOR 역할도 팬으로 참여 가능 (FR-004)", async () => {
      // CREATOR_CTX.creatorProfileId("cp-1")가 소유하지 않은 타인 프로그램("cp-other")에
      // 참여 신청하는 시나리오 — FR-004는 자기 프로그램만 금지한다.
      const program = {
        id: "prog-1",
        status: "RECRUITING",
        recruitDeadline: new Date(Date.now() + 86400000),
        creatorProfileId: "cp-other",
        priceKrw: 0,
        maxParticipants: 5,
        deletedAt: null,
        creatorProfile: { userId: "creator-user" },
      };
      mockPrisma.program.findUnique.mockResolvedValue(program);
      mockFindActiveApplication.mockResolvedValue(null);
      mockPrisma.programApplication.create.mockResolvedValue({ id: "app-1" });
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({ userId: "creator-user" });
      mockPrisma.notification.create.mockResolvedValue({ id: "notif-1" });

      const result = await applyToProgram(CREATOR_CTX, "prog-1", "fan-user", "message");

      expect(result.ok).toBe(true);
    });

    it("FAN 역할 신청 성공 (AC-001)", async () => {
      const program = {
        id: "prog-1",
        status: "RECRUITING",
        recruitDeadline: new Date(Date.now() + 86400000),
        creatorProfileId: "cp-2",
        priceKrw: 0,
        maxParticipants: 5,
        deletedAt: null,
        creatorProfile: { userId: "creator-user" },
      };
      mockPrisma.program.findUnique.mockResolvedValue(program);
      mockFindActiveApplication.mockResolvedValue(null);
      mockPrisma.programApplication.create.mockResolvedValue({ id: "app-1" });
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({ userId: "creator-user" });
      mockPrisma.notification.create.mockResolvedValue({ id: "notif-1" });

      const result = await applyToProgram(FAN_CTX, "prog-1", "fan-user", "message");

      expect(result.ok).toBe(true);
      expect(mockPrisma.programApplication.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          programId: "prog-1",
          userId: "fan-user",
          status: "ACCEPTED",
          message: "message",
        }),
      });
    });

    it("프로그램 없으면 404 (AC-001)", async () => {
      mockPrisma.program.findUnique.mockResolvedValue(null);

      const result = await applyToProgram(FAN_CTX, "prog-1", "fan-user");

      expect(result).toEqual({ ok: false, status: 404, error: "Program not found" });
    });

    it("soft-delete된 프로그램은 404 (AC-001)", async () => {
      mockPrisma.program.findUnique.mockResolvedValue({
        id: "prog-1",
        deletedAt: new Date(),
      });

      const result = await applyToProgram(FAN_CTX, "prog-1", "fan-user");

      expect(result).toEqual({ ok: false, status: 404, error: "Program not found" });
    });

    it("자기 프로그램은 FAN 역할로만 신청 가능 (FR-004)", async () => {
      const program = {
        id: "prog-1",
        status: "RECRUITING",
        recruitDeadline: new Date(Date.now() + 86400000),
        creatorProfileId: "cp-1",
        priceKrw: 0,
        maxParticipants: 5,
        deletedAt: null,
        creatorProfile: { userId: "creator-user" },
      };
      mockPrisma.program.findUnique.mockResolvedValue(program);

      const result = await applyToProgram(
        { role: "CREATOR", creatorProfileId: "cp-1" },
        "prog-1",
        "user-1",
      );

      // 자기 프로그램이고 CREATOR 역할이면 400 (FAN 역할만 신청 가능)
      expect(result).toEqual({ ok: false, status: 400, error: "Cannot apply to own program as CREATOR role" });
    });

    it("RECRUITING 상태가 아니면 400 (FR-003, AC-002)", async () => {
      const program = {
        id: "prog-1",
        status: "CLOSED",
        recruitDeadline: new Date(Date.now() + 86400000),
        creatorProfileId: "cp-2",
        priceKrw: 0,
        maxParticipants: 5,
        deletedAt: null,
        creatorProfile: { userId: "creator-user" },
      };
      mockPrisma.program.findUnique.mockResolvedValue(program);

      const result = await applyToProgram(FAN_CTX, "prog-1", "fan-user");

      expect(result).toEqual({ ok: false, status: 400, error: "Program is not recruiting" });
    });

    it("모집 기한 경과 시 400 (FR-003, AC-002)", async () => {
      const program = {
        id: "prog-1",
        status: "RECRUITING",
        recruitDeadline: new Date(Date.now() - 1000),
        creatorProfileId: "cp-2",
        priceKrw: 0,
        maxParticipants: 5,
        deletedAt: null,
        creatorProfile: { userId: "creator-user" },
      };
      mockPrisma.program.findUnique.mockResolvedValue(program);

      const result = await applyToProgram(FAN_CTX, "prog-1", "fan-user");

      expect(result).toEqual({ ok: false, status: 400, error: "Application deadline has passed" });
    });

    it("이미 활성 신청이 있으면 409 (FR-002, AC-002)", async () => {
      const program = {
        id: "prog-1",
        status: "RECRUITING",
        recruitDeadline: new Date(Date.now() + 86400000),
        creatorProfileId: "cp-2",
        priceKrw: 0,
        maxParticipants: 5,
        deletedAt: null,
        creatorProfile: { userId: "creator-user" },
      };
      mockPrisma.program.findUnique.mockResolvedValue(program);
      mockFindActiveApplication.mockResolvedValue({ id: "app-1" });

      const result = await applyToProgram(FAN_CTX, "prog-1", "fan-user");

      expect(result).toEqual({ ok: false, status: 409, error: "Already applied" });
    });

    it("신청 생성 성공 + 크리에이터 알림 생성 (AC-003, AC-004)", async () => {
      const program = {
        id: "prog-1",
        status: "RECRUITING",
        recruitDeadline: new Date(Date.now() + 86400000),
        creatorProfileId: "cp-2",
        priceKrw: 0,
        maxParticipants: 5,
        deletedAt: null,
        creatorProfile: { userId: "creator-user" },
      };
      mockPrisma.program.findUnique.mockResolvedValue(program);
      mockFindActiveApplication.mockResolvedValue(null);
      mockPrisma.programApplication.create.mockResolvedValue({ id: "app-1" });
      mockPrisma.creatorProfile.findUnique.mockResolvedValue({ userId: "creator-user" });
      mockPrisma.notification.create.mockResolvedValue({ id: "notif-1" });

      const result = await applyToProgram(FAN_CTX, "prog-1", "fan-user", "test message");

      expect(result.ok).toBe(true);
      expect(mockPrisma.programApplication.create).toHaveBeenCalled();
      expect(mockPrisma.creatorProfile.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "creator-user",
          type: "APPLICATION_CREATED",
        }),
      });
    });

    it("유료 프로그램은 mock 결제 성공 시 즉시 ACCEPTED, Payment, Settlement를 생성한다 (SPEC-015 REQ-PROG-002)", async () => {
      const program = {
        id: "prog-1",
        title: "유료 워크숍",
        status: "RECRUITING",
        recruitDeadline: new Date(Date.now() + 86400000),
        creatorProfileId: "cp-2",
        priceKrw: 30000,
        maxParticipants: 3,
        deletedAt: null,
        creatorProfile: { userId: "creator-user" },
      };
      mockPrisma.program.findUnique.mockResolvedValue(program);
      mockFindActiveApplication.mockResolvedValue(null);
      mockPrisma.programApplication.create.mockResolvedValue({ id: "app-1", status: "PENDING_PAYMENT" });
      mockPrisma.programApplication.update.mockResolvedValue({ id: "app-1", status: "ACCEPTED" });
      mockPrisma.payment.create.mockResolvedValue({ id: "pay-1" });
      mockPrisma.settlement.create.mockResolvedValue({ id: "set-1" });
      mockPrisma.notification.create.mockResolvedValue({ id: "notif-1" });

      const result = await applyToProgram(FAN_CTX, "prog-1", "fan-user", "message");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe("ACCEPTED");
        expect(result.data.paymentId).toBe("pay-1");
        expect(result.data.settlementId).toBe("set-1");
      }
      expect(mockPrisma.programApplication.count).toHaveBeenCalled();
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          programApplicationId: "app-1",
          fanUserId: "fan-user",
          amount: 30000,
          feeKrw: 3000,
          status: "PAID",
        }),
      });
      expect(mockPrisma.settlement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceType: "PROGRAM",
          sourceId: "prog-1",
          grossAmount: 30000,
          feeKrw: 3000,
          payout: 27000,
        }),
      });
    });

    it("정원이 찬 프로그램은 409를 반환한다 (SPEC-015 REQ-PROG-001)", async () => {
      mockPrisma.program.findUnique.mockResolvedValue({
        id: "prog-1",
        title: "소수 워크숍",
        status: "RECRUITING",
        recruitDeadline: new Date(Date.now() + 86400000),
        creatorProfileId: "cp-2",
        priceKrw: 0,
        maxParticipants: 1,
        deletedAt: null,
        creatorProfile: { userId: "creator-user" },
      });
      mockFindActiveApplication.mockResolvedValue(null);
      mockPrisma.programApplication.count.mockResolvedValue(1);

      const result = await applyToProgram(FAN_CTX, "prog-1", "fan-user");

      expect(result).toEqual({ ok: false, status: 409, error: "Program is full" });
      expect(mockPrisma.programApplication.create).not.toHaveBeenCalled();
    });
  });

  describe("cancelProgramApplication / removeProgramParticipant (SPEC-015)", () => {
    it("팬은 본인 신청을 CANCELLED로 바꾸고 결제/정산을 보류 처리한다", async () => {
      mockPrisma.programApplication.findUnique.mockResolvedValue({
        id: "app-1",
        userId: "fan-1",
        programId: "prog-1",
        status: "ACCEPTED",
        payment: {
          id: "pay-1",
          status: "PAID",
          settlement: { id: "set-1" },
        },
      });
      mockPrisma.programApplication.update.mockResolvedValue({ id: "app-1", status: "CANCELLED" });

      const result = await cancelProgramApplication("app-1", "fan-1");

      expect(result.ok).toBe(true);
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay-1" },
        data: { status: "REFUNDED" },
      });
      expect(mockPrisma.settlement.update).toHaveBeenCalledWith({
        where: { id: "set-1" },
        data: expect.objectContaining({ status: "ON_HOLD" }),
      });
    });

    it("크리에이터는 확정 참여자를 REMOVED로 제외할 수 있다", async () => {
      mockPrisma.programApplication.findUnique.mockResolvedValue({
        id: "app-1",
        userId: "fan-1",
        programId: "prog-1",
        status: "ACCEPTED",
        program: { creatorProfileId: "cp-1" },
        payment: null,
      });
      mockPrisma.programApplication.update.mockResolvedValue({ id: "app-1", status: "REMOVED" });

      const result = await removeProgramParticipant(CREATOR_CTX, "app-1", "운영 사유");

      expect(result.ok).toBe(true);
      expect(mockPrisma.programApplication.update).toHaveBeenCalledWith({
        where: { id: "app-1" },
        data: expect.objectContaining({
          status: "REMOVED",
          removedReason: "운영 사유",
        }),
      });
    });
  });

  describe("processApplication (FR-007~FR-009, AC-010~AC-012)", () => {
    it("비크리에이터는 403 (FR-008)", async () => {
      const result = await processApplication(FAN_CTX, "app-1", "accept");

      expect(result).toEqual({ ok: false, status: 403, error: "Forbidden: CREATOR role required" });
    });

    it("신청 없으면 404", async () => {
      mockPrisma.programApplication.findUnique.mockResolvedValue(null);

      const result = await processApplication(CREATOR_CTX, "app-1", "accept");

      expect(result).toEqual({ ok: false, status: 404, error: "Application not found" });
    });

    it("타인 프로그램 신청이면 403 (FR-008, AC-005)", async () => {
      mockPrisma.programApplication.findUnique.mockResolvedValue({
        id: "app-1",
        program: { creatorProfileId: "cp-other" },
      });

      const result = await processApplication(CREATOR_CTX, "app-1", "accept");

      expect(result).toEqual({ ok: false, status: 403, error: "Forbidden: not the program owner" });
    });

    it("PENDING이 아니면 400 (FR-009, AC-010)", async () => {
      mockPrisma.programApplication.findUnique.mockResolvedValue({
        id: "app-1",
        status: "ACCEPTED",
        program: { creatorProfileId: "cp-1" },
      });

      const result = await processApplication(CREATOR_CTX, "app-1", "accept");

      expect(result).toEqual({ ok: false, status: 400, error: "Application is not PENDING" });
    });

    it("accept 성공 (AC-010)", async () => {
      const application = {
        id: "app-1",
        status: "PENDING",
        userId: "fan-1",
        programId: "prog-1",
        program: { creatorProfileId: "cp-1" },
      };
      mockPrisma.programApplication.findUnique.mockResolvedValue(application);
      mockPrisma.programApplication.update.mockResolvedValue({ ...application, status: "ACCEPTED" });
      mockPrisma.notification.create.mockResolvedValue({ id: "notif-1" });

      const result = await processApplication(CREATOR_CTX, "app-1", "accept");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.application.status).toBe("ACCEPTED");
      }
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("accept + autoRejectOthers true면 다른 PENDING 자동 거절 (FR-007, AC-011)", async () => {
      const application = {
        id: "app-1",
        status: "PENDING",
        userId: "fan-1",
        programId: "prog-1",
        program: { creatorProfileId: "cp-1" },
      };
      mockPrisma.programApplication.findUnique.mockResolvedValue(application);
      mockPrisma.programApplication.update.mockResolvedValue({ ...application, status: "ACCEPTED" });
      mockPrisma.programApplication.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.programApplication.findMany.mockResolvedValue([
        { userId: "fan-2" },
        { userId: "fan-3" },
      ]);
      mockPrisma.notification.create.mockResolvedValue({ id: "notif-1" });
      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });

      const result = await processApplication(CREATOR_CTX, "app-1", "accept", true);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.autoRejectedCount).toBe(2);
      }
      expect(mockPrisma.programApplication.updateMany).toHaveBeenCalledWith({
        where: {
          programId: "prog-1",
          id: { not: "app-1" },
          status: "PENDING",
        },
        data: { status: "AUTO_REJECTED" },
      });
    });

    it("reject 성공 (AC-010)", async () => {
      const application = {
        id: "app-1",
        status: "PENDING",
        userId: "fan-1",
        programId: "prog-1",
        program: { creatorProfileId: "cp-1" },
      };
      mockPrisma.programApplication.findUnique.mockResolvedValue(application);
      mockPrisma.programApplication.update.mockResolvedValue({ ...application, status: "REJECTED" });
      mockPrisma.notification.create.mockResolvedValue({ id: "notif-1" });

      const result = await processApplication(CREATOR_CTX, "app-1", "reject");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.application.status).toBe("REJECTED");
      }
    });

    it("트랜잭션 내에서 알림 생성 실패 시 롤백 (AC-012)", async () => {
      let txCalls = 0;
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        txCalls++;
        if (txCalls === 1) {
          // 첫 호출: 알림 생성 시 throw
          const txPrisma = {
            ...mockPrisma,
            notification: {
              ...mockPrisma.notification,
              create: vi.fn().mockRejectedValue(new Error("Notification failed")),
            },
          };
          return cb(txPrisma);
        }
        return cb(mockPrisma);
      });

      const application = {
        id: "app-1",
        status: "PENDING",
        userId: "fan-1",
        programId: "prog-1",
        program: { creatorProfileId: "cp-1" },
      };
      mockPrisma.programApplication.findUnique.mockResolvedValue(application);

      const result = await processApplication(CREATOR_CTX, "app-1", "accept");

      // 트랜잭션 실패 시 오류 반환
      expect(result.ok).toBe(false);
    });
  });

  describe("notifyProgramClosed (FR-010, AC-006)", () => {
    it("PENDING 신청자들에게 알림 생성", async () => {
      mockPrisma.programApplication.findMany.mockResolvedValue([
        { userId: "fan-1" },
        { userId: "fan-2" },
      ]);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });

      await notifyProgramClosed("prog-1");

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: "fan-1", type: "PROGRAM_CLOSED" }),
          expect.objectContaining({ userId: "fan-2", type: "PROGRAM_CLOSED" }),
        ]),
      });
    });

    it("PENDING 신청이 없어도 정상 처리", async () => {
      mockPrisma.programApplication.findMany.mockResolvedValue([]);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 0 });

      await expect(notifyProgramClosed("prog-1")).resolves.toBeUndefined();
    });
  });
});
