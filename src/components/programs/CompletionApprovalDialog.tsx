"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * 작업 완료 승인 확인 다이얼로그 (SPEC-013).
 * Figma ArtBridge "CompletionApprovalDialog" 디자인 기준 (node 22:772).
 *
 * 참여자/거래금액 요약을 보여주고 승인 시 정산이 자동 요청됨을 안내한다.
 * 프레젠테이션 전용 — 실제 승인 처리는 onConfirm으로 위임한다.
 */
interface CompletionApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending?: boolean;
  participantName?: string | null;
  amountKrw?: number | null;
}

export function CompletionApprovalDialog({
  open,
  onOpenChange,
  onConfirm,
  pending = false,
  participantName,
  amountKrw,
}: CompletionApprovalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPanel className="max-w-[440px] gap-4 rounded-[var(--radius-modal)] border-border-default shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <DialogTitle className="text-lg font-bold leading-7">
          작업 완료를 승인할까요?
        </DialogTitle>

        <div className="flex flex-col gap-2 rounded-lg bg-[var(--surface-tint)] p-4">
          {participantName && (
            <p className="text-sm text-text-default">참여자: {participantName}</p>
          )}
          {amountKrw != null && (
            <p className="text-sm text-text-default">
              거래금액: ₩{amountKrw.toLocaleString("ko-KR")}
            </p>
          )}
          <p className="text-[13px] text-text-subtle">
            승인 후 정산이 자동 요청됩니다.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            size="sm"
          >
            취소
          </Button>
          <Button onClick={onConfirm} disabled={pending} size="sm">
            {pending ? "처리 중..." : "승인 및 정산 요청"}
          </Button>
        </DialogFooter>
      </DialogPanel>
    </Dialog>
  );
}
