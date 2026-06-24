import { cn } from "@/lib/utils";

export type SettlementStatusTone = "pending" | "approvable" | "settled" | "hold" | "adjusted";

const settlementStatusConfig: Record<
  SettlementStatusTone,
  { label: string; className: string }
> = {
  pending: {
    label: "정산 대기",
    className: "bg-[#fff7e6] text-[#b77900]",
  },
  approvable: {
    label: "정산 가능",
    className: "bg-[#eff6ff] text-[#2563eb]",
  },
  settled: {
    label: "정산 완료",
    className: "bg-[#ecfdf3] text-[#047857]",
  },
  hold: {
    label: "정산 보류",
    className: "bg-[#fef2f2] text-[#b42318]",
  },
  adjusted: {
    label: "조정 반영",
    className: "bg-[#f4f3ff] text-[#5925dc]",
  },
};

interface SettlementStatusBadgeProps {
  status: SettlementStatusTone;
  className?: string;
}

export function SettlementStatusBadge({
  status,
  className,
}: SettlementStatusBadgeProps) {
  const config = settlementStatusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-[13px] font-medium leading-none",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
