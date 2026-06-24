import { cn } from "@/lib/utils";

interface SettlementSummaryProps {
  totalAmount: number;
  totalCount: number;
  pendingAmount: number;
  pendingCount: number;
  settledAmount: number;
  settledCount: number;
  className?: string;
}

function formatKrw(amount: number) {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

function StatCell({
  label,
  amount,
  description,
}: {
  label: string;
  amount: number;
  description: string;
}) {
  return (
    <div className="flex min-h-[120px] min-w-0 flex-1 flex-col justify-center gap-1 px-5 py-4">
      <p className="text-[13px] text-text-muted">{label}</p>
      <p className="break-words text-2xl font-bold leading-8 text-text-default">
        {formatKrw(amount)}
      </p>
      <p className="text-xs text-text-muted">{description}</p>
    </div>
  );
}

export function SettlementSummary({
  totalAmount,
  totalCount,
  pendingAmount,
  pendingCount,
  settledAmount,
  settledCount,
  className,
}: SettlementSummaryProps) {
  const stats = [
    {
      label: "총 거래액",
      amount: totalAmount,
      description: `총 ${totalCount.toLocaleString("ko-KR")}건`,
    },
    {
      label: "정산 대기",
      amount: pendingAmount,
      description: `${pendingCount.toLocaleString("ko-KR")}건 대기 중`,
    },
    {
      label: "정산 완료",
      amount: settledAmount,
      description: `${settledCount.toLocaleString("ko-KR")}건 완료`,
    },
  ];

  const empty = totalCount === 0;

  if (empty) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-card)] border border-border-default bg-white px-5 py-8 text-center",
          className,
        )}
      >
        <p className="text-sm font-medium text-text-default">정산 내역이 없습니다.</p>
        <p className="mt-1 text-[13px] text-text-muted">
          완료 승인된 거래가 생기면 정산 금액이 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-[var(--radius-card)] border border-border-default bg-white sm:grid-cols-3",
        className,
      )}
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(index > 0 && "border-t border-border-default sm:border-l sm:border-t-0")}
        >
          <StatCell {...stat} />
        </div>
      ))}
    </div>
  );
}

