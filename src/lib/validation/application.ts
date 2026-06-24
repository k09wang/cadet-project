import { z } from "zod";

/**
 * 신청 검증 스키마 (SPEC-005).
 */

/**
 * 프로그램 참여 신청 입력 (FR-001, AC-001).
 * message는 선택값이며 1000자 제한이다.
 */
export const applySchema = z.object({
  message: z.string().max(1000).optional(),
});

/**
 * 신청 처리 입력.
 * - cancel: 팬 직접 신청 취소
 * - remove: 크리에이터가 확정 참여자 제외
 */
export const processSchema = z.object({
  action: z.enum(["cancel", "remove"]),
  removedReason: z.string().max(500).optional(),
});

export type ApplyInput = z.infer<typeof applySchema>;
export type ProcessInput = z.infer<typeof processSchema>;
