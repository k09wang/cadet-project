"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CompletionApprovalDialog } from "@/components/dashboard/CompletionApprovalDialog";

/**
 * 에스크로 완료 승인 버튼 — 참여자(팬=지불자)용 (SPEC-013 FR-006~FR-011, AC-004~AC-008).
 * 크리에이터의 납품 요청 후 본인 참여에 대해 호출. POST /api/applications/:id/approve-completion.
 * 완료 시 Payment/Settlement RELEASED, 모든 결제 완료 참여 승인이면 Program COMPLETED.
 *
 * 승인 전 CompletionApprovalDialog로 참여자/거래금액을 확인받는다 (Figma 22:772).
 */
export function ApproveCompletionButton({
  applicationId,
  participantName,
  amountKrw,
}: {
  applicationId: string;
  participantName?: string | null;
  amountKrw?: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleApprove() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/approve-completion`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "완료 승인에 실패했습니다.");
        return;
      }
      setOpen(false);
      setDone(true);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-[var(--radius-control)] bg-success/10 px-4 py-3 text-sm font-medium text-success">
        완료 승인되었습니다. 정산이 확정됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-card)] border border-border-strong bg-brand-subtle p-4">
      <p className="text-sm font-semibold text-text-default">
        크리에이터가 납품을 요청했습니다.
      </p>
      <p className="text-xs leading-5 text-text-subtle">
        내용을 확인하셨으면 완료를 승인해 주세요. 승인 시 정산이 확정됩니다.
      </p>
      <Button onClick={() => setOpen(true)} disabled={pending} className="w-full">
        완료 승인하기
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <CompletionApprovalDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleApprove}
        pending={pending}
        participantName={participantName}
        amountKrw={amountKrw}
      />
    </div>
  );
}
