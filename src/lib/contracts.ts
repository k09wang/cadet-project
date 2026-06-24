import { prisma } from "@/lib/prisma";
import type { ProgramStatus } from "@prisma/client";
import {
  buildNotificationMessage,
  notificationHref,
} from "@/lib/notification-types";
import { resolvePaymentProvider } from "@/lib/payment/provider";

/**
 * 계약(약관) · 금액 조율 · 양측 전자 서명 · 결제 서비스
 * (SPEC-006 + SPEC-011 금액 조율/양측 서명 + SPEC-012 PG sandbox 결제).
 *
 * SPEC-005의 ServiceResult 판별 유니온 패턴을 재사용한다.
 * 결제 확정은 단일 트랜잭션으로 Payment/Settlement/Program/Notification의 원자성을 보장한다(NFR-001/NFR-003).
 *
 * 합의 상태 표현(SPEC-011 안 1 채택): `Contract.terms` JSON에 임베드 — 마이그레이션 불필요.
 *   terms.amountProposedAt / amountAgreedAt / amountRejectedAt (ISO 문자열 | null)
 */

const FEE_RATE = 0.1; // 플랫폼 수수료 10% (NFR-003)

export type ContractServiceContext = {
  userId: string;
  role: string;
  creatorProfileId: string | null | undefined;
};

export type ContractServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400 | 403 | 404 | 409 | 500; error: string };

/** 약관 본문 — 데모용 고정 텍스트. terms Json 스냅샷에 포함된다. */
export const AGREEMENT_TEXT =
  "본 계약은 ArtBridge 데모를 위한 약관입니다. 팬은 프로그램 참여 대금을 결제하며, 플랫폼은 완료 승인 시까지 대금을 보관(에스크로)합니다. 플랫폼 수수료는 10%입니다.";

type ApplicationWithProgram = {
  id: string;
  userId: string;
  status: string;
  program: { id: string; title: string; priceKrw: number; creatorProfileId: string; status: string };
};

/** 계약 접근 권한 판정: 팬 본인 또는 크리에이터 소유자 (FR-011, FR-012, SPEC-011 FR-022). */
function resolveAccess(
  ctx: ContractServiceContext,
  fanUserId: string,
  creatorProfileId: string,
): "fan" | "creator" | null {
  if (ctx.userId === fanUserId) return "fan";
  if (ctx.role === "CREATOR" && ctx.creatorProfileId === creatorProfileId) return "creator";
  return null;
}

// ────────────── terms Json 금액 합의 상태 파싱 (SPEC-011 안 1) ──────────────

type ContractTerms = {
  programTitle?: string;
  priceKrw?: number;
  agreement?: string;
  amountProposedAt?: string | null;
  amountAgreedAt?: string | null;
  amountRejectedAt?: string | null;
};

/** terms JSON을 안전하게 객체로 파싱한다(레거시/비정형 대비). */
function readTerms(raw: unknown): ContractTerms {
  if (raw && typeof raw === "object") return raw as ContractTerms;
  return {};
}

/** UI/검증용 금액 합의 상태 도출 (SPEC-011 §3 판정 규칙). */
export function deriveAmountState(termsRaw: unknown): {
  proposed: boolean;
  agreed: boolean;
  rejected: boolean;
} {
  const t = readTerms(termsRaw);
  return {
    proposed: !!t.amountProposedAt,
    agreed: !!t.amountAgreedAt,
    rejected: !!t.amountRejectedAt,
  };
}

/**
 * 계약 생성/조회 (SPEC-006 FR-001/FR-002/FR-011, AC-001).
 *
 * ACCEPTED 신청에 대해 계약이 없으면 생성(terms Json에 programTitle/priceKrw/약관 스냅샷),
 * 있으면 기존 레코드를 반환한다(멱등). 팬 본인 또는 크리에이터 소유자만 접근 가능.
 */
export async function getOrCreateContract(
  ctx: ContractServiceContext,
  applicationId: string,
): Promise<ContractServiceResult<{ id: string }>> {
  const application = (await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true, contract: true },
  })) as (ApplicationWithProgram & { contract: { id: string } | null }) | null;

  if (!application) {
    return { ok: false, status: 404, error: "Application not found" };
  }

  const access = resolveAccess(ctx, application.userId, application.program.creatorProfileId);
  if (!access) {
    return { ok: false, status: 403, error: "Forbidden: not the contract participant" };
  }

  if (application.contract) {
    return { ok: true, data: { id: application.contract.id } };
  }

  if (application.status !== "ACCEPTED") {
    return { ok: false, status: 400, error: "Application is not ACCEPTED" };
  }

  const created = await prisma.contract.create({
    data: {
      applicationId,
      agreedAmount: application.program.priceKrw,
      terms: {
        programTitle: application.program.title,
        priceKrw: application.program.priceKrw,
        agreement: AGREEMENT_TEXT,
        amountProposedAt: null,
        amountAgreedAt: null,
        amountRejectedAt: null,
      },
    },
  });

  return { ok: true, data: { id: created.id } };
}

type ContractWithApplication = {
  id: string;
  agreedAmount: number;
  fanSignedAt: Date | null;
  creatorSignedAt: Date | null;
  terms: unknown;
  application: {
    id: string;
    userId: string;
    status: string;
    program: { id: string; title: string; priceKrw: number; creatorProfileId: string; status: string };
  };
};

async function loadContract(id: string): Promise<ContractWithApplication | null> {
  return (await prisma.contract.findUnique({
    where: { id },
    include: { application: { include: { program: true } } },
  })) as ContractWithApplication | null;
}

// ────────────── SPEC-011: 금액 조율 (합의 금액) ──────────────

/**
 * 합의 금액 제시 (SPEC-011 FR-001~FR-003, FR-006, AC-001~AC-003).
 *
 * 프로그램 소유 크리에이터가 양의 정수 금액을 제시하면 agreedAmount를 갱신하고
 * terms.amountProposedAt을 기록하며 팬에게 CONTRACT_AMOUNT_PROPOSED 알림을 보낸다.
 */
export async function proposeAmount(
  ctx: ContractServiceContext,
  contractId: string,
  amount: number,
): Promise<ContractServiceResult<{ agreedAmount: number }>> {
  const contract = await loadContract(contractId);
  if (!contract) {
    return { ok: false, status: 404, error: "Contract not found" };
  }

  // 권한: 프로그램 소유 크리에이터만 (FR-003, AC-002)
  const access = resolveAccess(
    ctx,
    contract.application.userId,
    contract.application.program.creatorProfileId,
  );
  if (access !== "creator") {
    return { ok: false, status: 403, error: "Forbidden: only the program owner can propose amount" };
  }

  // 이미 서명/결제된 계약은 금액 재조율 불가 (정합)
  if (contract.fanSignedAt) {
    return { ok: false, status: 409, error: "Cannot propose amount after fan signed" };
  }

  const now = new Date();
  const terms = readTerms(contract.terms);
  terms.amountProposedAt = now.toISOString();
  terms.amountAgreedAt = null;
  terms.amountRejectedAt = null;

  await prisma.contract.update({
    where: { id: contractId },
    data: { agreedAmount: amount, terms },
  });

  // FR-006: 팬에게 합의 금액 제시 알림
  await prisma.notification.create({
    data: {
      userId: contract.application.userId,
      type: "CONTRACT_AMOUNT_PROPOSED",
      message: buildNotificationMessage("CONTRACT_AMOUNT_PROPOSED", {}),
      linkUrl: notificationHref("CONTRACT_AMOUNT_PROPOSED", { contractId }),
    },
  });

  return { ok: true, data: { agreedAmount: amount } };
}

/**
 * 합의 금액 동의 (SPEC-011 FR-004~FR-005).
 *
 * 팬 본인이 동의하면 terms.amountAgreedAt을 기록한다. 제시되지 않은 상태면 400 (FR-005).
 * 본 함수는 팬 서명(signContract)과 통합 운영할 수 있으나, 별도 엔드포인트로도 노출된다.
 */
export async function agreeAmount(
  ctx: ContractServiceContext,
  contractId: string,
): Promise<ContractServiceResult<{ amountAgreedAt: string }>> {
  const contract = await loadContract(contractId);
  if (!contract) {
    return { ok: false, status: 404, error: "Contract not found" };
  }

  if (ctx.userId !== contract.application.userId) {
    return { ok: false, status: 403, error: "Forbidden: only the fan can agree" };
  }

  const state = deriveAmountState(contract.terms);
  if (!state.proposed || state.rejected) {
    return { ok: false, status: 400, error: "Amount has not been proposed" };
  }
  if (state.agreed) {
    return { ok: true, data: { amountAgreedAt: readTerms(contract.terms).amountAgreedAt ?? new Date().toISOString() } };
  }

  const now = new Date();
  const terms = readTerms(contract.terms);
  terms.amountAgreedAt = now.toISOString();
  await prisma.contract.update({
    where: { id: contractId },
    data: { terms },
  });

  return { ok: true, data: { amountAgreedAt: now.toISOString() } };
}

/**
 * 합의 금액 거부/결렬 (SPEC-011 FR-007~FR-010, NFR-001, AC-006~AC-008).
 *
 * 단일 트랜잭션으로: 신청 REJECTED, terms.amountRejectedAt 기록,
 * 프로그램 CONTRACTING이면 RECRUITING 복귀(권장 정책), 크리에이터에게 결렬 알림.
 */
export async function rejectAmount(
  ctx: ContractServiceContext,
  contractId: string,
): Promise<ContractServiceResult<{ applicationStatus: string; programStatus: string }>> {
  const contract = await loadContract(contractId);
  if (!contract) {
    return { ok: false, status: 404, error: "Contract not found" };
  }

  if (ctx.userId !== contract.application.userId) {
    return { ok: false, status: 403, error: "Forbidden: only the fan can reject" };
  }

  const state = deriveAmountState(contract.terms);
  if (!state.proposed || state.rejected) {
    return { ok: false, status: 400, error: "Amount has not been proposed" };
  }

  // FR-010: 이미 서명/결제된 계약은 결렬 불가 (409)
  if (contract.fanSignedAt) {
    return { ok: false, status: 409, error: "Cannot reject after signing" };
  }

  const now = new Date();
  const terms = readTerms(contract.terms);
  terms.amountRejectedAt = now.toISOString();
  const programStatus = (
    contract.application.program.status === "CONTRACTING"
      ? "RECRUITING"
      : contract.application.program.status
  ) as ProgramStatus;

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contractId },
        data: { terms },
      });
      await tx.programApplication.update({
        where: { id: contract.application.id },
        data: { status: "REJECTED" },
      });
      if (programStatus !== contract.application.program.status) {
        await tx.program.update({
          where: { id: contract.application.program.id },
          data: { status: programStatus },
        });
      }
      // FR-009: 크리에이터에게 결렬 알림 (프로그램 소유자 = creatorProfile.userId)
      const owner = await tx.creatorProfile.findUnique({
        where: { id: contract.application.program.creatorProfileId },
        select: { userId: true },
      });
      if (owner) {
        await tx.notification.create({
          data: {
            userId: owner.userId,
            type: "CONTRACT_AMOUNT_REJECTED",
            message: buildNotificationMessage("CONTRACT_AMOUNT_REJECTED", {}),
            linkUrl: notificationHref("CONTRACT_AMOUNT_REJECTED", { contractId }),
          },
        });
      }
      return { applicationStatus: "REJECTED", programStatus };
    });

    return { ok: true, data: result };
  } catch {
    return { ok: false, status: 500, error: "Reject transaction failed" };
  }
}

// ────────────── SPEC-011: 양측 전자 서명 ──────────────

/**
 * 팬 서명 (SPEC-006 FR-003/FR-004 + SPEC-011 FR-011/FR-014/FR-015/FR-020).
 *
 * 팬 본인이 동의하면 fanSignedAt을 설정한다. SPEC-011 확장:
 *  - 금액이 제시되었으면 동의(amountAgreedAt)를 먼저 요구(FR-014) — 합의 없이 서명 불가.
 *  - 양측 서명 완료(fanSignedAt && creatorSignedAt) 시 CONTRACT_SIGNED 알림(FR-020).
 */
export async function signContract(
  ctx: ContractServiceContext,
  contractId: string,
  agreed: boolean,
): Promise<ContractServiceResult<{ fanSignedAt: Date }>> {
  const contract = await loadContract(contractId);
  if (!contract) {
    return { ok: false, status: 404, error: "Contract not found" };
  }

  const access = resolveAccess(
    ctx,
    contract.application.userId,
    contract.application.program.creatorProfileId,
  );
  if (access !== "fan") {
    return { ok: false, status: 403, error: "Forbidden: only the fan can sign" };
  }

  if (!agreed) {
    return { ok: false, status: 400, error: "Agreement is required to sign" };
  }

  // FR-014: 금액이 제시되었지만 아직 합의되지 않았으면 서명 불가 (금액 합의 선행).
  const state = deriveAmountState(contract.terms);
  if (state.proposed && !state.agreed && !state.rejected) {
    return { ok: false, status: 400, error: "Agree to the proposed amount before signing" };
  }

  const now = new Date();
  // 멱등: 이미 서명했으면 시각 보존 (NFR-003)
  const fanSignedAt = contract.fanSignedAt ?? now;
  const terms = readTerms(contract.terms);
  if (state.proposed && !terms.amountAgreedAt) {
    // 팬 동의 = 이 금액으로 서명. amountAgreedAt 세팅(SPEC-011 안 1 통합).
    terms.amountAgreedAt = now.toISOString();
  }

  await prisma.contract.update({
    where: { id: contractId },
    data: { fanSignedAt, terms },
  });

  // FR-020: 양측 서명 완료 알림(크리에이터 서명이 이미 있으면 지금 완료).
  if (contract.creatorSignedAt) {
    await notifyContractSigned(contractId, contract.application.userId, contract.application.program.creatorProfileId);
  }

  return { ok: true, data: { fanSignedAt } };
}

/**
 * 크리에이터 서명 (SPEC-011 FR-012/FR-013/FR-015/FR-020, AC-010/AC-011).
 *
 * 프로그램 소유 크리에이터가 동의하면 creatorSignedAt을 설정한다.
 * 양측 서명 완료 시 CONTRACT_SIGNED 알림.
 */
export async function signContractAsCreator(
  ctx: ContractServiceContext,
  contractId: string,
  agreed: boolean,
): Promise<ContractServiceResult<{ creatorSignedAt: Date }>> {
  const contract = await loadContract(contractId);
  if (!contract) {
    return { ok: false, status: 404, error: "Contract not found" };
  }

  const access = resolveAccess(
    ctx,
    contract.application.userId,
    contract.application.program.creatorProfileId,
  );
  if (access !== "creator") {
    return { ok: false, status: 403, error: "Forbidden: only the program owner can sign as creator" };
  }

  if (!agreed) {
    return { ok: false, status: 400, error: "Agreement is required to sign" };
  }

  const creatorSignedAt = contract.creatorSignedAt ?? new Date();
  await prisma.contract.update({
    where: { id: contractId },
    data: { creatorSignedAt },
  });

  // FR-020: 양측 서명 완료 알림(팬 서명이 이미 있으면 지금 완료).
  if (contract.fanSignedAt) {
    await notifyContractSigned(contractId, contract.application.userId, contract.application.program.creatorProfileId);
  }

  return { ok: true, data: { creatorSignedAt } };
}

/** 양측 서명 완료 알림을 팬·크리에이터 모두에게 발송 (SPEC-011 FR-020, AC-015). */
async function notifyContractSigned(
  contractId: string,
  fanUserId: string,
  creatorProfileId: string,
): Promise<void> {
  const owner = await prisma.creatorProfile.findUnique({
    where: { id: creatorProfileId },
    select: { userId: true },
  });
  const recipients = new Set<string>([fanUserId]);
  if (owner) recipients.add(owner.userId);
  await prisma.notification.createMany({
    data: Array.from(recipients).map((userId) => ({
      userId,
      type: "CONTRACT_SIGNED",
      message: buildNotificationMessage("CONTRACT_SIGNED", {}),
      linkUrl: notificationHref("CONTRACT_SIGNED", { contractId }),
    })),
  });
}

// ────────────── SPEC-012: PG sandbox 결제 ──────────────

/**
 * 결제 시작/요청 생성 (SPEC-006 FR-005~FR-010 + SPEC-011 FR-017~FR-019 + SPEC-012 FR-005~FR-008).
 *
 * - 양측 서명(fanSignedAt && creatorSignedAt) 완료 시에만 진행 (SPEC-011 FR-017).
 * - 결제 금액은 Contract.agreedAmount(합의 금액)를 단일 출처로 사용 (FR-019, NFR-006).
 * - Provider 분기(SPEC-012): Mock 폴밭이면 즉시 PAID 트랜잭션(기존 흐름),
 *   sandbox면 Payment(PENDING, merchantUid, provider)만 생성하고 결제창 메타를 반환.
 */
export async function startPayment(
  ctx: ContractServiceContext,
  contractId: string,
): Promise<
  ContractServiceResult<{
    paymentId: string;
    settlementId: string | null;
    programStatus: string;
    provider: string;
    merchantUid: string;
    /** Mock 폴밭: "PAID"(즉시 확정). sandbox: "PENDING"(검증 대기). */
    status: "PAID" | "PENDING";
    /** sandbox 결제창 호출용 메타. Mock 폴밭은 빈 객체. */
    paymentParams: Record<string, string>;
  }>
> {
  const contract = await loadContract(contractId);
  if (!contract) {
    return { ok: false, status: 404, error: "Contract not found" };
  }

  if (ctx.userId !== contract.application.userId) {
    return { ok: false, status: 403, error: "Forbidden: only the fan can pay" };
  }

  // SPEC-011 FR-017: 양측 서명 완료 가드
  if (!contract.fanSignedAt || !contract.creatorSignedAt) {
    return { ok: false, status: 400, error: "Both signatures are required before payment" };
  }

  // 중복 결제 차단 (SPEC-006 FR-008, SPEC-012 FR-007)
  const existing = await prisma.payment.findFirst({
    where: { contractId, status: { in: ["PAID", "RELEASED"] } },
  });
  if (existing) {
    return { ok: false, status: 409, error: "Contract already paid" };
  }

  const amount = contract.agreedAmount || contract.application.program.priceKrw;
  const feeKrw = Math.round(amount * FEE_RATE);
  const payout = amount - feeKrw;
  const fanUserId = contract.application.userId;
  const programId = contract.application.program.id;
  const productName = contract.application.program.title;

  const provider = resolvePaymentProvider();
  const request = provider.createRequest({ contractId, amount, productName });

  // ── Mock 폴밭: 즉시 PAID 확정 (SPEC-012 FR-015) ──
  if (provider.name === "mock") {
    const charge = await provider.charge({ contractId, amount });
    if (!charge.success) {
      return { ok: false, status: 500, error: "Payment charge failed" };
    }
    try {
      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            contractId,
            fanUserId,
            amount,
            feeKrw,
            status: "PAID",
            provider: provider.name,
            providerTxId: charge.providerTxId,
            merchantUid: request.merchantUid,
          },
        });
        const settlement = await tx.settlement.create({
          data: { paymentId: payment.id, payout, status: "PENDING" },
        });
        const program = await tx.program.update({
          where: { id: programId },
          data: { status: "IN_PROGRESS" },
        });
        await tx.notification.create({
          data: {
            userId: fanUserId,
            type: "PAYMENT_COMPLETED",
            message: buildNotificationMessage("PAYMENT_COMPLETED", {}),
            linkUrl: notificationHref("PAYMENT_COMPLETED", { contractId }),
          },
        });
        return {
          paymentId: payment.id,
          settlementId: settlement.id,
          programStatus: program.status,
        };
      });
      return {
        ok: true,
        data: {
          ...result,
          provider: provider.name,
          merchantUid: request.merchantUid,
          status: "PAID",
          paymentParams: request.paymentParams,
        },
      };
    } catch (err) {
      if (isUniqueViolation(err)) {
        return { ok: false, status: 409, error: "Contract already paid" };
      }
      return { ok: false, status: 500, error: "Payment transaction failed" };
    }
  }

  // ── sandbox 경로: PENDING 결제 요청 생성 후 결제창 메타 반환 (SPEC-012 FR-005) ──
  try {
    const payment = await prisma.payment.create({
      data: {
        contractId,
        fanUserId,
        amount,
        feeKrw,
        status: "PENDING",
        provider: provider.name,
        merchantUid: request.merchantUid,
      },
    });
    return {
      ok: true,
      data: {
        paymentId: payment.id,
        settlementId: null,
        programStatus: contract.application.program.status,
        provider: provider.name,
        merchantUid: request.merchantUid,
        status: "PENDING",
        paymentParams: request.paymentParams,
      },
    };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, status: 409, error: "Contract already paid" };
    }
    return { ok: false, status: 500, error: "Payment request creation failed" };
  }
}

/**
 * 결제 검증/확정 (SPEC-012 FR-011~FR-015, NFR-002/NFR-003, AC-005~AC-008/AC-014).
 *
 * PG 콜백/리다이렉트로 수신한 merchantUid + providerTxId로 서버 측 PG 단건 조회 후 대조:
 *  (a) status === "paid", (b) amount === Payment.amount, (c) merchantUid 일치(sandbox 한정).
 * 성공 시 단일 트랜잭션으로 Payment.PAID + providerTxId 확정 + Settlement + Program.IN_PROGRESS + 알림.
 * 실패 시 Payment.FAILED. 이미 PAID면 멱등 반환(FR-014).
 */
export async function verifyPayment(
  ctx: ContractServiceContext,
  input: { merchantUid: string; providerTxId: string },
): Promise<ContractServiceResult<{ paymentId: string; status: string; programStatus: string }>> {
  const payment = await prisma.payment.findUnique({
    where: { merchantUid: input.merchantUid },
    include: {
      contract: { include: { application: { include: { program: true } } } },
    },
  });
  if (!payment || !payment.contract) {
    return { ok: false, status: 404, error: "Payment not found" };
  }

  // 권한: 해당 계약의 팬 본인만 (FR-019, AC-010)
  if (ctx.userId !== payment.fanUserId) {
    return { ok: false, status: 403, error: "Forbidden: only the fan can verify this payment" };
  }

  // 멱등: 이미 확정된 결제 (FR-014, AC-008)
  if (payment.status === "PAID" || payment.status === "RELEASED") {
    return {
      ok: true,
      data: { paymentId: payment.id, status: payment.status, programStatus: payment.contract.application.program.status },
    };
  }

  const provider = resolvePaymentProvider();
  let verification;
  if (provider.name === "mock") {
    // Mock 폴밭 — 서버 보관값을 신뢰 기준으로 사용 (FR-015).
    verification = { merchantUid: payment.merchantUid ?? "", amount: payment.amount, status: "paid" };
  } else {
    verification = await provider.verifyPayment(input.providerTxId);
  }

  const amountOk = verification.amount === payment.amount;
  const statusOk = verification.status === "paid";
  const merchantOk = provider.name === "mock" || verification.merchantUid === payment.merchantUid;

  if (!amountOk || !statusOk || !merchantOk) {
    // FR-013: 검증 실패 → FAILED, 부수효과 없음
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", providerTxId: input.providerTxId },
    });
    return { ok: false, status: 400, error: "Payment verification failed" };
  }

  const amount = payment.amount;
  const feeKrw = payment.feeKrw || Math.round(amount * FEE_RATE);
  const payout = amount - feeKrw;
  const programId = payment.contract.application.program.id;
  const fanUserId = payment.fanUserId;
  const contractId = payment.contract.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", providerTxId: input.providerTxId },
      });
      await tx.settlement.create({
        data: { paymentId: payment.id, payout, status: "PENDING" },
      });
      const program = await tx.program.update({
        where: { id: programId },
        data: { status: "IN_PROGRESS" },
      });
      await tx.notification.create({
        data: {
          userId: fanUserId,
          type: "PAYMENT_COMPLETED",
          message: buildNotificationMessage("PAYMENT_COMPLETED", {}),
          linkUrl: notificationHref("PAYMENT_COMPLETED", { contractId }),
        },
      });
      return { paymentId: updated.id, status: updated.status, programStatus: program.status };
    });
    return { ok: true, data: result };
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Settlement paymentId unique 위반(이미 존재) — 멱등하게 PAID로 간주
      return {
        ok: true,
        data: { paymentId: payment.id, status: "PAID", programStatus: payment.contract.application.program.status },
      };
    }
    return { ok: false, status: 500, error: "Payment verification transaction failed" };
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}
