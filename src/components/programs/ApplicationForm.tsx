"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export interface ApplicationFormProps {
  programId: string;
  applied: boolean;
  recruiting: boolean;
  owner: boolean;
  programTitle?: string;
  creatorName?: string | null;
  capacity?: number | null;
}

const fieldClass =
  "w-full rounded-lg border border-border-strong bg-white px-3 py-2.5 text-sm text-text-default placeholder:text-neutral-400 outline-none transition-colors hover:border-neutral-400 focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20";
const labelClass = "text-[13px] font-medium text-text-subtle";

/**
 * Program application form aligned with ArtBridge ApplicationForm (Figma 26:720).
 */
export function ApplicationForm({
  programId,
  applied,
  recruiting,
  owner,
  programTitle,
  creatorName,
  capacity,
}: ApplicationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!recruiting || owner) {
    return null;
  }

  if (applied) {
    return (
      <div className="flex w-full max-w-[520px] flex-col gap-2 rounded-[var(--radius-card)] border border-success/30 bg-success/5 p-6">
        <p className="text-sm font-bold text-text-default">신청 완료</p>
        <p className="text-[13px] text-text-subtle">
          신청이 확정되었습니다. 마이페이지에서 참여 상태와 결제 내역을 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!agreed) {
      setError("신청 조건 및 환불 정책에 동의해 주세요.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/programs/${programId}/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message.trim() || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 409) {
            setError("이미 신청했습니다.");
          } else if (response.status === 400) {
            setError(data.error || "본인 프로그램에는 신청할 수 없습니다.");
          } else if (response.status === 401) {
            setError("로그인이 필요합니다.");
          } else {
            setError("신청 중 오류가 발생했습니다.");
          }
          return;
        }

        setSuccess(true);
        router.refresh();
      } catch {
        setError("네트워크 오류가 발생했습니다.");
      }
    });
  };

  return (
    <div className="flex w-full max-w-[520px] flex-col gap-4 rounded-[var(--radius-card)] border border-border-default bg-white p-6">
      <p className="font-heading text-base font-bold text-text-default">프로그램 참여 신청</p>

      {(programTitle || creatorName) && (
        <div className="flex w-full items-center gap-3 rounded-lg bg-[var(--surface-tint)] p-3">
          <div className="size-14 shrink-0 rounded-md bg-[#e0fbf9]" aria-hidden />
          <div className="flex min-w-0 flex-col gap-1">
            {programTitle && (
              <p className="truncate text-sm font-bold text-text-default">{programTitle}</p>
            )}
            <p className="truncate text-[13px] text-text-muted">
              {creatorName ? `${creatorName} 크리에이터` : "크리에이터"}
              {capacity != null ? ` · 정원 ${capacity}명` : ""}
            </p>
          </div>
        </div>
      )}

      {success && <p className="text-sm text-success">신청이 완료되었습니다.</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className={labelClass} htmlFor="application-message">
            신청 메시지
          </label>
          <textarea
            id="application-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className={`${fieldClass} h-[100px] resize-none`}
            placeholder="크리에이터에게 남길 메시지가 있다면 간략히 써주세요."
          />
        </div>

        <label className="flex items-center gap-2 text-[13px] text-text-subtle">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="size-4 rounded-[3px] border-[1.5px] border-border-strong text-brand-primary accent-brand-primary"
          />
          신청 조건 및 환불 정책에 동의합니다.
        </label>

        <Button type="submit" disabled={isPending || !agreed} className="self-start">
          {isPending ? "신청 중..." : "신청 제출"}
        </Button>
      </form>
    </div>
  );
}
