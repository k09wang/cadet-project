import { prisma } from "@/lib/prisma";
import { findActiveApplication } from "@/lib/queries/applications";
import { buildNotificationMessage, notificationHref } from "@/lib/notification-types";
import { resolvePaymentProvider } from "@/lib/payment/provider";

/**
 * 프로그램 신청 서비스 (SPEC-005 FR-001~FR-009, FR-012, AC-001~AC-012).
 *
 * ServiceContext와 ServiceResult 판별 유니온을 재사용한다.
 * 트랜잭션을 사용하여 신청 상태 변경과 알림 생성의 원자성을 보장한다.
 */

export type ApplicationServiceContext = {
  role: string;
  creatorProfileId: string | null | undefined;
};

export type ApplicationServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400 | 403 | 404 | 409 | 500; error: string };

const FEE_RATE = 0.1;
const PROGRAM_PAYMENT_RESERVATION_MINUTES = 15;

class SeatUnavailableError extends Error {}

function ensureCreator(
  ctx: ApplicationServiceContext,
): ApplicationServiceResult<string> {
  if (ctx.role !== "CREATOR" || !ctx.creatorProfileId) {
    return { ok: false, status: 403, error: "Forbidden: CREATOR role required" };
  }
  return { ok: true, data: ctx.creatorProfileId };
}

/**
 * 프로그램 참여 신청 (FR-001~FR-004, AC-001~AC-004).
 *
 * - CREATOR 역할도 팬으로 참여 가능 (FR-004)
 * - 단, 자기 프로그램을 CREATOR 역할로 신청할 수 없다 (FR-004)
 * - RECRUITING 상태이고 모집 기한 내에만 신청 가능 (FR-003)
 * - 이미 활성(PENDING/ACCEPTED) 신청이 있으면 409 (FR-002)
 */
export async function applyToProgram(
  ctx: ApplicationServiceContext,
  programId: string,
  userId: string,
  message?: string,
): Promise<
  ApplicationServiceResult<{
    id: string;
    status: string;
    paymentId: string | null;
    settlementId: string | null;
    amount: number;
    provider: string | null;
    merchantUid: string | null;
    paymentParams: Record<string, string>;
  }>
> {
  // 프로그램 로드
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { creatorProfile: { select: { userId: true } } },
  });
  if (!program || program.deletedAt) {
    return { ok: false, status: 404, error: "Program not found" };
  }

  // CREATOR 역할은 자기 프로그램에 FAN 역할로만 신청 가능 (FR-004)
  if (ctx.role === "CREATOR" && program.creatorProfileId === ctx.creatorProfileId) {
    return { ok: false, status: 400, error: "Cannot apply to own program as CREATOR role" };
  }

  // RECRUITING 상태 확인 (FR-003)
  if (program.status !== "RECRUITING") {
    return { ok: false, status: 400, error: "Program is not recruiting" };
  }

  // 모집 기한 확인 (FR-003)
  if (program.recruitDeadline && program.recruitDeadline < new Date()) {
    return { ok: false, status: 400, error: "Application deadline has passed" };
  }

  // 중복 신청 확인 (FR-002)
  const existing = await findActiveApplication(programId, userId);
  if (existing) {
    return { ok: false, status: 409, error: "Already applied" };
  }

  if (!program.creatorProfile) {
    return { ok: false, status: 404, error: "Creator profile not found" };
  }

  const amount = program.priceKrw ?? 0;
  const isPaidProgram = amount > 0;
  const feeKrw = Math.round(amount * FEE_RATE);
  const payout = amount - feeKrw;
  const provider = isPaidProgram ? resolvePaymentProvider() : null;
  const now = new Date();
  const paymentExpiresAt = new Date(
    now.getTime() + PROGRAM_PAYMENT_RESERVATION_MINUTES * 60 * 1000,
  );

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (program.maxParticipants !== null) {
        const occupiedSeats = await tx.programApplication.count({
          where: {
            programId,
            OR: [
              { status: "ACCEPTED" },
              {
                status: { in: ["RESERVED", "PENDING_PAYMENT"] },
                paymentExpiresAt: { gt: now },
              },
            ],
          },
        });
        if (occupiedSeats >= program.maxParticipants) {
          throw new SeatUnavailableError("Program is full");
        }
      }

      const created = await tx.programApplication.create({
        data: {
          programId,
          userId,
          status: isPaidProgram ? "PENDING_PAYMENT" : "ACCEPTED",
          message,
          paymentExpiresAt: isPaidProgram ? paymentExpiresAt : null,
        },
      });

      await tx.notification.create({
        data: {
          userId: program.creatorProfile.userId,
          type: "APPLICATION_CREATED",
          message: buildNotificationMessage("APPLICATION_CREATED", {}),
          linkUrl: notificationHref("APPLICATION_CREATED", { programId }),
        },
      });

      if (!isPaidProgram || !provider) {
        await tx.notification.create({
          data: {
            userId,
            type: "APPLICATION_ACCEPTED",
            message: buildNotificationMessage("APPLICATION_ACCEPTED", {}),
            linkUrl: notificationHref("APPLICATION_ACCEPTED", { programId }),
          },
        });
        return {
          id: created.id,
          status: created.status,
          paymentId: null,
          settlementId: null,
          amount: 0,
          provider: null,
          merchantUid: null,
          paymentParams: {},
        };
      }

      const request = provider.createRequest({
        programApplicationId: created.id,
        amount,
        productName: program.title,
      });

      if (provider.name !== "mock") {
        const payment = await tx.payment.create({
          data: {
            programApplicationId: created.id,
            fanUserId: userId,
            amount,
            feeKrw,
            status: "PENDING",
            provider: provider.name,
            merchantUid: request.merchantUid,
          },
        });
        await tx.notification.create({
          data: {
            userId,
            type: "PROGRAM_SEAT_RESERVED",
            message: buildNotificationMessage("PROGRAM_SEAT_RESERVED", {}),
            linkUrl: notificationHref("PROGRAM_SEAT_RESERVED", { programId }),
          },
        });
        return {
          id: created.id,
          status: created.status,
          paymentId: payment.id,
          settlementId: null,
          amount,
          provider: provider.name,
          merchantUid: request.merchantUid,
          paymentParams: request.paymentParams,
        };
      }

      const charge = await provider.charge({ programApplicationId: created.id, amount });
      if (!charge.success) {
        await tx.programApplication.update({
          where: { id: created.id },
          data: { status: "PAYMENT_FAILED", paymentFailedAt: new Date() },
        });
        throw new Error("Payment charge failed");
      }

      const [updatedApplication, payment] = await Promise.all([
        tx.programApplication.update({
          where: { id: created.id },
          data: { status: "ACCEPTED" },
        }),
        tx.payment.create({
          data: {
            programApplicationId: created.id,
            fanUserId: userId,
            amount,
            feeKrw,
            status: "PAID",
            provider: provider.name,
            providerTxId: charge.providerTxId,
            merchantUid: request.merchantUid,
          },
        }),
      ]);

      const settlement = await tx.settlement.create({
        data: {
          paymentId: payment.id,
          sourceType: "PROGRAM",
          sourceId: programId,
          grossAmount: amount,
          feeKrw,
          payout,
          status: "PENDING",
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: "PROGRAM_PAYMENT_PAID",
          message: buildNotificationMessage("PROGRAM_PAYMENT_PAID", {}),
          linkUrl: notificationHref("PROGRAM_PAYMENT_PAID", { programId }),
        },
      });

      return {
        id: updatedApplication.id,
        status: updatedApplication.status,
        paymentId: payment.id,
        settlementId: settlement.id,
        amount,
        provider: provider.name,
        merchantUid: request.merchantUid,
        paymentParams: request.paymentParams,
      };
    });

    return { ok: true, data: result };
  } catch (err) {
    if (err instanceof SeatUnavailableError) {
      return { ok: false, status: 409, error: "Program is full" };
    }
    return { ok: false, status: 500, error: "Application creation failed" };
  }
}

export async function cancelProgramApplication(
  applicationId: string,
  userId: string,
): Promise<ApplicationServiceResult<{ id: string; status: string }>> {
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { payment: { include: { settlement: true } } },
  });
  if (!application) {
    return { ok: false, status: 404, error: "Application not found" };
  }
  if (application.userId !== userId) {
    return { ok: false, status: 403, error: "Forbidden: only the applicant can cancel" };
  }
  if (!["ACCEPTED", "RESERVED", "PENDING_PAYMENT"].includes(application.status)) {
    return { ok: false, status: 400, error: "Application cannot be cancelled" };
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.programApplication.update({
        where: { id: applicationId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      if (application.payment?.status === "PAID") {
        await tx.payment.update({
          where: { id: application.payment.id },
          data: { status: "REFUNDED" },
        });
        if (application.payment.settlement) {
          await tx.settlement.update({
            where: { id: application.payment.settlement.id },
            data: {
              status: "ON_HOLD",
              heldReason: "Program application cancelled by fan",
            },
          });
        }
      }
      await tx.notification.create({
        data: {
          userId,
          type: "PROGRAM_APPLICATION_CANCELLED",
          message: buildNotificationMessage("PROGRAM_APPLICATION_CANCELLED", {}),
          linkUrl: notificationHref("PROGRAM_APPLICATION_CANCELLED", {
            programId: application.programId,
          }),
        },
      });
      return cancelled;
    });
    return { ok: true, data: { id: updated.id, status: updated.status } };
  } catch {
    return { ok: false, status: 500, error: "Application cancellation failed" };
  }
}

export async function removeProgramParticipant(
  ctx: ApplicationServiceContext,
  applicationId: string,
  reason?: string,
): Promise<ApplicationServiceResult<{ id: string; status: string }>> {
  const guard = ensureCreator(ctx);
  if (!guard.ok) return guard;

  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: true,
      payment: { include: { settlement: true } },
    },
  });
  if (!application) {
    return { ok: false, status: 404, error: "Application not found" };
  }
  if (application.program.creatorProfileId !== guard.data) {
    return { ok: false, status: 403, error: "Forbidden: not the program owner" };
  }
  if (application.status !== "ACCEPTED") {
    return { ok: false, status: 400, error: "Participant is not accepted" };
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const removed = await tx.programApplication.update({
        where: { id: applicationId },
        data: {
          status: "REMOVED",
          removedAt: new Date(),
          removedReason: reason,
        },
      });
      if (application.payment?.status === "PAID") {
        await tx.payment.update({
          where: { id: application.payment.id },
          data: { status: "REFUNDED" },
        });
        if (application.payment.settlement) {
          await tx.settlement.update({
            where: { id: application.payment.settlement.id },
            data: {
              status: "ON_HOLD",
              heldReason: reason ?? "Program participant removed by creator",
            },
          });
        }
      }
      await tx.notification.create({
        data: {
          userId: application.userId,
          type: "PROGRAM_PARTICIPANT_REMOVED",
          message: buildNotificationMessage("PROGRAM_PARTICIPANT_REMOVED", {}),
          linkUrl: notificationHref("PROGRAM_PARTICIPANT_REMOVED", {
            programId: application.programId,
          }),
        },
      });
      return removed;
    });
    return { ok: true, data: { id: updated.id, status: updated.status } };
  } catch {
    return { ok: false, status: 500, error: "Participant removal failed" };
  }
}

/**
 * 신청 처리 - 수락/거절 (FR-007~FR-009, AC-010~AC-012).
 *
 * 단일 트랜잭션 내에서:
 * - 신청 상태 변경
 * - autoRejectOthers true면 다른 PENDING 자동 거절 (FR-007)
 * - 관련 알림 생성
 *
 * 알림 생성 실패 시 전체 롤백 (AC-012).
 */
export async function processApplication(
  ctx: ApplicationServiceContext,
  applicationId: string,
  action: "accept" | "reject",
  autoRejectOthers = false,
): Promise<
  ApplicationServiceResult<{
    application: { id: string; status: string };
    autoRejectedCount: number;
  }>
> {
  const guard = ensureCreator(ctx);
  if (!guard.ok) return guard;

  // 신청 로드 (프로그램 포함)
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true },
  });
  if (!application) {
    return { ok: false, status: 404, error: "Application not found" };
  }

  // 소유권 확인 (FR-008, AC-005)
  if (application.program.creatorProfileId !== guard.data) {
    return { ok: false, status: 403, error: "Forbidden: not the program owner" };
  }

  // PENDING 상태 확인 (FR-009, AC-010)
  if (application.status !== "PENDING") {
    return { ok: false, status: 400, error: "Application is not PENDING" };
  }

  // 트랜잭션 내에서 상태 변경 + 알림 생성.
  // 알림/상태 변경 중 하나라도 실패하면 트랜잭션이 전체 롤백된다(AC-012).
  // 서비스는 트랜잭션 예외를 ServiceResult(ok:false)로 변환하여 반환한다.
  try {
    const result = await prisma.$transaction(async (tx) => {
    let autoRejectedCount = 0;

    if (action === "accept") {
      // 대상 신청 수락
      const updated = await tx.programApplication.update({
        where: { id: applicationId },
        data: { status: "ACCEPTED" },
      });

      // autoRejectOthers true면 다른 PENDING 자동 거절 (FR-007)
      if (autoRejectOthers) {
        const rejectResult = await tx.programApplication.updateMany({
          where: {
            programId: application.programId,
            id: { not: applicationId },
            status: "PENDING",
          },
          data: { status: "AUTO_REJECTED" },
        });
        autoRejectedCount = rejectResult.count;

        // 자동 거절된 신청자들에게 알림 (AC-011)
        if (autoRejectedCount > 0) {
          const autoRejected = await tx.programApplication.findMany({
            where: {
              programId: application.programId,
              status: "AUTO_REJECTED",
            },
            select: { userId: true },
          });
          await tx.notification.createMany({
            data: autoRejected.map((a) => ({
              userId: a.userId,
              type: "APPLICATION_AUTO_REJECTED",
              message: buildNotificationMessage("APPLICATION_AUTO_REJECTED", {}),
              linkUrl: notificationHref("APPLICATION_AUTO_REJECTED", {
                programId: application.programId,
              }),
            })),
          });
        }
      }

      // PRD §14.1: CONTRACTING 전이 — autoRejectOthers이거나 정원이 충족되면 모집 종료
      if (application.program.status === "RECRUITING") {
        let shouldContracting = autoRejectOthers;
        if (!shouldContracting && application.program.maxParticipants !== null) {
          const acceptedCount = await tx.programApplication.count({
            where: { programId: application.programId, status: "ACCEPTED" },
          });
          shouldContracting = acceptedCount >= application.program.maxParticipants;
        }
        if (shouldContracting) {
          await tx.program.update({
            where: { id: application.programId },
            data: { status: "CONTRACTING" },
          });
        }
      }

      // 신청자에게 수락 알림
      await tx.notification.create({
        data: {
          userId: application.userId,
          type: "APPLICATION_ACCEPTED",
          message: buildNotificationMessage("APPLICATION_ACCEPTED", {}),
          linkUrl: notificationHref("APPLICATION_ACCEPTED", {
            programId: application.programId,
          }),
        },
      });

      return { application: updated, autoRejectedCount };
    } else {
      // 거절
      const updated = await tx.programApplication.update({
        where: { id: applicationId },
        data: { status: "REJECTED" },
      });

      // 신청자에게 거절 알림
      await tx.notification.create({
        data: {
          userId: application.userId,
          type: "APPLICATION_REJECTED",
          message: buildNotificationMessage("APPLICATION_REJECTED", {}),
          linkUrl: notificationHref("APPLICATION_REJECTED", {
            programId: application.programId,
          }),
        },
      });

      return { application: updated, autoRejectedCount: 0 };
    }
    });

    return { ok: true, data: result };
  } catch {
    return { ok: false, status: 500, error: "Application processing failed" };
  }
}

/**
 * 프로그램 마감 알림 (FR-010, AC-006).
 *
 * 모든 PENDING 신청자에게 PROGRAM_CLOSED 알림을 생성한다.
 */
export async function notifyProgramClosed(programId: string): Promise<void> {
  const pendingApplications = await prisma.programApplication.findMany({
    where: {
      programId,
      status: "PENDING",
    },
    select: { userId: true },
  });

  if (pendingApplications.length === 0) return;

  await prisma.notification.createMany({
    data: pendingApplications.map((a) => ({
      userId: a.userId,
      type: "PROGRAM_CLOSED",
      message: buildNotificationMessage("PROGRAM_CLOSED", {}),
      linkUrl: notificationHref("PROGRAM_CLOSED", { programId }),
    })),
  });
}
