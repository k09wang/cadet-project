"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PostComposerProps {
  action: (formData: FormData) => void | Promise<void>;
}

const VISIBILITY = [
  { value: "PUBLIC", label: "전체 공개" },
  { value: "MEMBER_ONLY", label: "멤버십 한정" },
  { value: "PAID", label: "유료" },
] as const;

const fieldClass =
  "w-full rounded-lg border border-border-strong bg-white px-3 py-2.5 text-sm text-text-default placeholder:text-neutral-400 outline-none transition-colors hover:border-neutral-400 focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20";

function SubmitActions() {
  const { pending } = useFormStatus();
  return (
    <div className="flex justify-end gap-2">
      <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
        임시저장
      </Button>
      <Button type="submit" name="intent" value="publish" disabled={pending}>
        {pending ? "게시 중..." : "게시하기"}
      </Button>
    </div>
  );
}

/**
 * Creator post composer aligned with ArtBridge PostComposer (Figma 25:720/25:761).
 */
export function PostComposer({ action }: PostComposerProps) {
  const [visibility, setVisibility] = useState<"PUBLIC" | "MEMBER_ONLY" | "PAID">("PUBLIC");

  return (
    <form
      action={action}
      className="flex w-full max-w-[560px] flex-col gap-4 rounded-[var(--radius-card)] border border-border-default bg-white p-6"
    >
      <p className="font-heading text-base font-bold text-text-default">포스트 작성</p>

      <input
        id="title"
        name="title"
        type="text"
        required
        aria-label="제목"
        className={fieldClass}
        placeholder="포스트 제목을 입력하세요"
      />

      <textarea
        id="body"
        name="body"
        required
        rows={5}
        aria-label="본문"
        className={cn(fieldClass, "h-[120px] resize-none")}
        placeholder="내용을 작성하세요..."
      />

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-text-subtle">공개 범위</span>
        <div className="inline-flex w-fit gap-0.5 rounded-lg bg-neutral-100 p-1">
          {VISIBILITY.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => setVisibility(v.value)}
              aria-pressed={visibility === v.value}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] transition-colors",
                visibility === v.value
                  ? "bg-white font-medium text-text-default shadow-sm"
                  : "text-text-subtle hover:text-text-default",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="visibility" value={visibility} />
      </div>

      {visibility === "PAID" && (
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-text-subtle" htmlFor="priceKrw">
            콘텐츠 가격 (원)
          </label>
          <input
            id="priceKrw"
            name="priceKrw"
            type="number"
            min={1}
            required
            className={fieldClass}
            placeholder="예: 5000"
          />
        </div>
      )}

      <SubmitActions />
    </form>
  );
}
