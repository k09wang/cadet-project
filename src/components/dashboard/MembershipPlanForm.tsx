"use client";

import { Button } from "@/components/ui/button";

/**
 * 멤버십 플랜 생성/수정 폼 컴포넌트 (SPEC-003 FR-001, SPEC-014 REQ-1-004, REQ-2-003).
 * initial prop으로 기존 값 주입 가능 (수정 모드, AI 추천 주입 모두 지원).
 */
export interface MembershipPlanFormInitial {
  title?: string;
  priceKrw?: number;
  description?: string;
}

interface MembershipPlanFormProps {
  action: (formData: FormData) => void | Promise<void>;
  /** 초기값 주입 — 수정 모드 또는 AI 추천 반영 시 사용 */
  initial?: MembershipPlanFormInitial;
  submitLabel?: string;
}

export function MembershipPlanForm({
  action,
  initial,
  submitLabel = "멤버십 플랜 생성",
}: MembershipPlanFormProps) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">플랜 이름</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initial?.title ?? ""}
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="예: 브론즈 멤버십"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="priceKrw">월 가격 (원)</label>
        <input
          id="priceKrw"
          name="priceKrw"
          type="number"
          min={1}
          required
          defaultValue={initial?.priceKrw ?? ""}
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="5000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="description">설명 (선택)</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="멤버십 혜택을 설명해주세요"
        />
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
