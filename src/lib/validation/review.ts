import { z } from "zod";

/**
 * 리뷰 검증 스키마 (SPEC-008 FR-005, FR-007, AC-005, AC-007).
 *
 * - rating: 1~5 정수 (FR-007, AC-007). 범위 밖이면 검증 실패 → 400.
 * - comment: 선택. 빈 문자열/공백은 null로 정규화하여 저장하지 않는다.
 * - tags: 선택. 최대 5개, 각 1~20자. 공백·중복·빈 값은 정규화해 제거한다 (PRD §4.1 Review tags).
 */
/**
 * 리뷰 작성 검증 스키마 (SPEC-008 + SPEC-013 FR-012~FR-018).
 *
 * - revieweeId: 양방향 평가에서 피평가자 지정. 크리에이터가 특정 팬을 평가할 때 필수.
 *   팬→크리에이터 평가에서는 서버가 자동 세팅하므로 생략 가능.
 */
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  tags: z
    .array(z.string().trim().max(20))
    .max(5)
    .optional()
    .transform((v) => {
      const cleaned = (v ?? []).map((t) => t.trim()).filter((t) => t.length > 0);
      return Array.from(new Set(cleaned));
    }),
  revieweeId: z.string().min(1).optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
