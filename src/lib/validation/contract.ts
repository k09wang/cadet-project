import { z } from "zod";

/**
 * 계약/결제 검증 스키마 (SPEC-006, SPEC-011, SPEC-012).
 */

/**
 * 서명 입력 (SPEC-006 FR-003, FR-004, AC-002, AC-003).
 * `agreed`는 반의시 true여야 한다. false/누락 시 검증 실패 → 400.
 */
export const signSchema = z.object({
  agreed: z.literal(true),
});

/**
 * 금액 조율 — 합의 금액 제시 (SPEC-011 FR-001, FR-002, AC-003).
 * 양의 정수만 허용(0·음수·비정수 거부). 클라이언트가 보낸 값을 신뢰하지 않고
 * 서비스가 agreedAmount를 갱신한다.
 */
export const amountProposeSchema = z.object({
  amount: z.number().int().positive(),
});

/**
 * 금액 조율 — 팬 동의/거부 (SPEC-011 FR-004, FR-007).
 * agree는 agreed:true, reject는 agreed:false를 강제한다 (혼용 방지).
 */
export const amountAgreeSchema = z.object({
  agreed: z.literal(true),
});
export const amountRejectSchema = z.object({
  agreed: z.literal(false),
});

/**
 * 결제 시작 입력 (SPEC-006 FR-006, FR-007 + SPEC-012).
 * provider는 선택 — 명시하지 않으면 서버가 환경 변수로 분기한다(SPEC-012 FR-002/FR-003).
 * 클라이언트가 provider를 신뢰성으로 받지 않는다(NFR-002 서버 권위 검증).
 */
export const paymentSchema = z.object({
  provider: z.enum(["mock", "portone", "toss"]).default("mock"),
});

/**
 * 결제 검증 입력 (SPEC-012 FR-011 콜백).
 * 클라이언트/PG가 전달한 merchantUid + PG 거래 ID. 서버가 PG 단건 조회로 대조.
 */
export const paymentCallbackSchema = z.object({
  merchantUid: z.string().min(1),
  providerTxId: z.string().min(1),
});

/**
 * 계약 생성/조회 입력 (FR-001, FR-002).
 */
export const createContractSchema = z.object({
  applicationId: z.string().min(1),
});

export type SignInput = z.infer<typeof signSchema>;
export type AmountProposeInput = z.infer<typeof amountProposeSchema>;
export type AmountAgreeInput = z.infer<typeof amountAgreeSchema>;
export type AmountRejectInput = z.infer<typeof amountRejectSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type PaymentCallbackInput = z.infer<typeof paymentCallbackSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;
