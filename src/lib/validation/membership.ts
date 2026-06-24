import { z } from "zod";

/**
 * 멤버십 플랜 생성 스키마 (SPEC-003 FR-001, AC-009).
 * priceKrw는 양수 정수 필수.
 */
export const membershipPlanCreateSchema = z.object({
  title: z.string().min(1).max(100),
  priceKrw: z.number().int().positive(),
  description: z.string().max(500).optional(),
});

export type MembershipPlanCreateInput = z.infer<typeof membershipPlanCreateSchema>;

/**
 * 멤버십 플랜 수정 스키마 (SPEC-014 REQ-1-005).
 * createSchema의 partial — 모든 필드가 선택적.
 */
export const membershipPlanUpdateSchema = membershipPlanCreateSchema.partial();

export type MembershipPlanUpdateInput = z.infer<typeof membershipPlanUpdateSchema>;
