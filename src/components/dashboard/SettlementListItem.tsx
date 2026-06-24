import { Button } from "@/components/ui/button";
import {
  SettlementStatusBadge,
  type SettlementStatusTone,
} from "@/components/dashboard/SettlementStatusBadge";
import { cn } from "@/lib/utils";

interface SettlementListItemProps {
  programTitle: string;
  participantName: string;
  amount: number;
  status: SettlementStatusTone;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

function formatKrw(amount: number) {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

const defaultActionLabels: Record<SettlementStatusTone, string> = {
  pending: "완료 승인",
  approvable: "정산 요청",
  settled: "정산 완료",
  hold: "확인 필요",
  adjusted: "조정 완료",
};

export function SettlementListItem({
  programTitle,
  participantName,
  amount,
  status,
  actionLabel,
  onAction,
  className,
}: SettlementListItemProps) {
  const displayActionLabel = actionLabel ?? defaultActionLabels[status];
  const actionable = !["settled", "adjusted"].includes(status) && !!onAction;

  return (
    <div
      className={cn(
        "grid min-h-[68px] gap-3 border border-border-default bg-white px-4 py-3 text-sm md:grid-cols-[minmax(180px,340px)_minmax(150px,200px)_160px_160px_180px] md:items-center",
        className,
      )}
    >
      <p className="min-w-0 font-medium text-text-default md:truncate">
        {programTitle}
      </p>
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-text-muted">
          {participantName.slice(0, 1)}
        </span>
        <p className="min-w-0 text-text-default md:truncate">{participantName}</p>
      </div>
      <p className="font-medium text-text-default">{formatKrw(amount)}</p>
      <SettlementStatusBadge status={status} className="w-fit text-xs" />
      <div>
        {actionable ? (
          <Button size="xs" onClick={onAction}>
            {displayActionLabel}
          </Button>
        ) : (
          <p className="text-[13px] text-text-muted">{displayActionLabel}</p>
        )}
      </div>
    </div>
  );
}
