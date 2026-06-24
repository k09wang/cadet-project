import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted: factory가 참조하는 mockPrisma를 호이스팅한다 (memory: vi.hoisted 필수).
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    program: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    programApplication: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    settlement: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    creatorProfile: {
      findUnique: vi.fn(),
    },
    review: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  requestDelivery,
  approveCompletion,
  completeProgram,
  createReview,
  type ReviewServiceContext,
} from "./reviews";

const FAN_ID = "fan-1";
const FAN2_ID = "fan-2";
const CREATOR_USER_ID = "creator-user-1";
const CREATOR_PROFILE_ID = "cprof-1";
const PROGRAM_ID = "prog-1";
const APP_ID = "app-1";

const CREATOR_CTX: ReviewServiceContext = {
  userId: CREATOR_USER_ID,
  role: "CREATOR",
  creatorProfileId: CREATOR_PROFILE_ID,
};

const FAN_CTX: ReviewServiceContext = {
  userId: FAN_ID,
  role: "FAN",
  creatorProfileId: null,
};

function programFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: PROGRAM_ID,
    status: "IN_PROGRESS",
    creatorProfileId: CREATOR_PROFILE_ID,
    deletedAt: null,
    ...overrides,
  };
}

/** requestDelivery/approveCompletion용 application 픽스처. */
function appFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: APP_ID,
    programId: PROGRAM_ID,
    userId: FAN_ID,
    deliveryRequestedAt: null,
    completionApprovedAt: null,
    program: { id: PROGRAM_ID, status: "IN_PROGRESS", creatorProfileId: CREATOR_PROFILE_ID },
    ...overrides,
  };
}

function wireTransaction() {
  mockPrisma.$transaction.mockImplementation(
    async (cb: (tx: typeof mockPrisma) => unknown) => cb(mockPrisma),
  );
}
/** 배열 형태 $transaction([op1, op2])도 지원 — Promise.all로 실행. */
function wireArrayTransaction() {
  mockPrisma.$transaction.mockImplementation(async (ops: unknown[]) =>
    Promise.all((ops as Promise<unknown>[]).map((op) => op)),
  );
}

beforeEach(() => {
  Object.values(mockPrisma).forEach((m) => {
    if (typeof m === "function") return;
    Object.values(m as Record<string, ReturnType<typeof vi.fn>>).forEach((fn) =>
      fn.mockReset(),
    );
  });
});

afterEach(() => vi.clearAllMocks());

// ───────────────────────── requestDelivery ─────────────────────────

describe("requestDelivery (SPEC-013 FR-001~FR-005)", () => {
  it("소유 크리에이터가 PAID 참여에 납품 요청 → deliveryRequestedAt + 알림 (AC-001)", async () => {
    mockPrisma.programApplication.findUnique.mockResolvedValue(appFixture());
    mockPrisma.payment.findFirst.mockResolvedValue({ id: "pay-1" });
    wireArrayTransaction();

    const result = await requestDelivery(CREATOR_CTX, APP_ID);

    expect(result.ok).toBe(true);
    expect(mockPrisma.programApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: APP_ID }, data: expect.objectContaining({ deliveryRequestedAt: expect.any(Date) }) }),
    );
    expect(mockPrisma.notification.create).toHaveBeenCalled();
  });

  it("이미 요청됐으면 멱등 — 기존 시각 반환, 알림 미발송 (FR-005)", async () => {
    const ts = new Date();
    mockPrisma.programApplication.findUnique.mockResolvedValue(
      appFixture({ deliveryRequestedAt: ts }),
    );
    mockPrisma.payment.findFirst.mockResolvedValue({ id: "pay-1" });
    const result = await requestDelivery(CREATOR_CTX, APP_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.notifiedFan).toBe(false);
    expect(mockPrisma.programApplication.update).not.toHaveBeenCalled();
  });

  it("비소유/팬이면 403 (FR-003)", async () => {
    mockPrisma.programApplication.findUnique.mockResolvedValue(appFixture());
    const result = await requestDelivery(FAN_CTX, APP_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("PAID 결제가 없으면 400 (FR-004)", async () => {
    mockPrisma.programApplication.findUnique.mockResolvedValue(appFixture());
    mockPrisma.payment.findFirst.mockResolvedValue(null);
    const result = await requestDelivery(CREATOR_CTX, APP_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("미존재 신청이면 404", async () => {
    mockPrisma.programApplication.findUnique.mockResolvedValue(null);
    const result = await requestDelivery(CREATOR_CTX, APP_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });
});

// ───────────────────────── approveCompletion ─────────────────────────

describe("approveCompletion (SPEC-013 FR-006~FR-011, NFR-001)", () => {
  it("지불자(팬) 승인 → Payment/Settlement RELEASED + completionApprovedAt (AC-005)", async () => {
    mockPrisma.programApplication.findUnique.mockResolvedValue(
      appFixture({ deliveryRequestedAt: new Date() }),
    );
    wireTransaction();
    mockPrisma.payment.findFirst.mockResolvedValue({ id: "pay-1" });
    mockPrisma.settlement.findUnique.mockResolvedValue({ id: "set-1" });
    mockPrisma.payment.update.mockResolvedValue({ id: "pay-1" });
    mockPrisma.settlement.update.mockResolvedValue({ id: "set-1" });
    mockPrisma.programApplication.findMany.mockResolvedValue([{ id: APP_ID, completionApprovedAt: new Date() }]);
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ userId: CREATOR_USER_ID });
    mockPrisma.notification.create.mockResolvedValue({ id: "n-1" });
    mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });

    const result = await approveCompletion(FAN_CTX, APP_ID);

    expect(result.ok).toBe(true);
    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "pay-1" }, data: { status: "RELEASED" } }),
    );
    expect(mockPrisma.settlement.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { paymentId: "pay-1" }, data: { status: "RELEASED" } }),
    );
    if (result.ok) {
      expect(result.data.releasedPayment).toBe(true);
      expect(result.data.releasedSettlement).toBe(true);
    }
  });

  it("납품 요청 없으면 400 (에스크로 순서, FR-007)", async () => {
    mockPrisma.programApplication.findUnique.mockResolvedValue(appFixture());
    const result = await approveCompletion(FAN_CTX, APP_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("지불자가 아니면 403 (FR-008)", async () => {
    mockPrisma.programApplication.findUnique.mockResolvedValue(
      appFixture({ deliveryRequestedAt: new Date() }),
    );
    const otherFan: ReviewServiceContext = { userId: FAN2_ID, role: "FAN", creatorProfileId: null };
    const result = await approveCompletion(otherFan, APP_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("Settlement 누락 시 트랜잭션 롤백 → 500 (AC-007, 정산 무결성)", async () => {
    mockPrisma.programApplication.findUnique.mockResolvedValue(
      appFixture({ deliveryRequestedAt: new Date() }),
    );
    wireTransaction();
    mockPrisma.payment.findFirst.mockResolvedValue({ id: "pay-1" });
    mockPrisma.settlement.findUnique.mockResolvedValue(null); // 누락

    const result = await approveCompletion(FAN_CTX, APP_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(500);
    // Payment=RELEASED는 시도되지 않아야(누락에서 throw)
    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });
});

// ───────────────────────── completeProgram (일괄 납품 요청) ─────────────────────────

describe("completeProgram (SPEC-008 라우트 호환 + SPEC-013 일괄 납품 요청)", () => {
  it("미납품 PAID 참여 일괄 납품 요청 → deliveryRequestedAt + 알림", async () => {
    mockPrisma.program.findUnique.mockResolvedValue(programFixture());
    wireArrayTransaction();
    mockPrisma.programApplication.findMany.mockResolvedValue([
      { id: APP_ID, userId: FAN_ID },
      { id: "app-2", userId: FAN2_ID },
    ]);

    const result = await completeProgram(CREATOR_CTX, PROGRAM_ID);

    expect(result.ok).toBe(true);
    expect(mockPrisma.programApplication.updateMany).toHaveBeenCalled();
    expect(mockPrisma.notification.createMany).toHaveBeenCalled();
    if (result.ok) {
      expect(result.data.requestedDeliveries).toBe(2);
      expect(result.data.notifiedParticipants).toBe(2);
    }
  });

  it("비소유/팬이면 403", async () => {
    mockPrisma.program.findUnique.mockResolvedValue(programFixture());
    const result = await completeProgram(FAN_CTX, PROGRAM_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("IN_PROGRESS가 아니면 400", async () => {
    mockPrisma.program.findUnique.mockResolvedValue(programFixture({ status: "RECRUITING" }));
    const result = await completeProgram(CREATOR_CTX, PROGRAM_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("미존재/soft-delete면 404", async () => {
    mockPrisma.program.findUnique.mockResolvedValue(null);
    const result = await completeProgram(CREATOR_CTX, PROGRAM_ID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });
});

// ───────────────────────── createReview (양방향) ─────────────────────────

describe("createReview (SPEC-013 FR-012~FR-018 양방향)", () => {
  it("팬 → 크리에이터: revieweeId 자동 세팅, 완료 승인 참여면 생성 (FR-012)", async () => {
    mockPrisma.program.findUnique.mockResolvedValue(programFixture({ status: "COMPLETED" }));
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ userId: CREATOR_USER_ID });
    mockPrisma.programApplication.findFirst.mockResolvedValue({ id: APP_ID });
    mockPrisma.review.findFirst.mockResolvedValue(null);
    mockPrisma.review.create.mockResolvedValue({ id: "rev-1", rating: 5, comment: "좋았습니다", tags: [] });

    const result = await createReview(FAN_CTX, PROGRAM_ID, {
      rating: 5,
      comment: "좋았습니다",
      tags: ["소통이 좋아요"],
    });

    expect(result.ok).toBe(true);
    const arg = mockPrisma.review.create.mock.calls[0][0];
    expect(arg.data).toMatchObject({
      programId: PROGRAM_ID,
      userId: FAN_ID,
      revieweeId: CREATOR_USER_ID,
      rating: 5,
    });
  });

  it("크리에이터 → 팬: revieweeId(팬) 필수, 완료 승인된 참여자여야 (FR-013/FR-017)", async () => {
    mockPrisma.program.findUnique.mockResolvedValue(programFixture({ status: "COMPLETED" }));
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ userId: CREATOR_USER_ID });
    mockPrisma.programApplication.findFirst.mockResolvedValue({ id: APP_ID });
    mockPrisma.review.findFirst.mockResolvedValue(null);
    mockPrisma.review.create.mockResolvedValue({ id: "rev-c", rating: 4, comment: null, tags: [] });

    const result = await createReview(CREATOR_CTX, PROGRAM_ID, {
      rating: 4,
      comment: null,
      tags: [],
      revieweeId: FAN_ID,
    });

    expect(result.ok).toBe(true);
    const arg = mockPrisma.review.create.mock.calls[0][0];
    expect(arg.data.revieweeId).toBe(FAN_ID);
  });

  it("크리에이터 리뷰 시 revieweeId 누락이면 400", async () => {
    mockPrisma.program.findUnique.mockResolvedValue(programFixture({ status: "COMPLETED" }));
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ userId: CREATOR_USER_ID });
    const result = await createReview(CREATOR_CTX, PROGRAM_ID, {
      rating: 4,
      comment: null,
      tags: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("완료 승인되지 않은 참여자면 403 (FR-016)", async () => {
    mockPrisma.program.findUnique.mockResolvedValue(programFixture({ status: "COMPLETED" }));
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ userId: CREATOR_USER_ID });
    mockPrisma.programApplication.findFirst.mockResolvedValue(null);
    const result = await createReview(FAN_CTX, PROGRAM_ID, {
      rating: 5,
      comment: null,
      tags: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("이미 리뷰 존재 시 409 (FR-014)", async () => {
    mockPrisma.program.findUnique.mockResolvedValue(programFixture({ status: "COMPLETED" }));
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ userId: CREATOR_USER_ID });
    mockPrisma.programApplication.findFirst.mockResolvedValue({ id: APP_ID });
    mockPrisma.review.findFirst.mockResolvedValue({ id: "rev-existing" });

    const result = await createReview(FAN_CTX, PROGRAM_ID, {
      rating: 4,
      comment: null,
      tags: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
    expect(mockPrisma.review.create).not.toHaveBeenCalled();
  });

  it("미존재 프로그램이면 404", async () => {
    mockPrisma.program.findUnique.mockResolvedValue(null);
    const result = await createReview(FAN_CTX, PROGRAM_ID, {
      rating: 5,
      comment: null,
      tags: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("unique 위반(P2002) 시 409 (NFR-003)", async () => {
    mockPrisma.program.findUnique.mockResolvedValue(programFixture({ status: "COMPLETED" }));
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ userId: CREATOR_USER_ID });
    mockPrisma.programApplication.findFirst.mockResolvedValue({ id: APP_ID });
    mockPrisma.review.findFirst.mockResolvedValue(null);
    mockPrisma.review.create.mockRejectedValue(
      Object.assign(new Error("unique"), { code: "P2002" }),
    );
    const result = await createReview(FAN_CTX, PROGRAM_ID, {
      rating: 5,
      comment: null,
      tags: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });
});
