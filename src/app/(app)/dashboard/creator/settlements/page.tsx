import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listCreatorSettlements } from "@/lib/queries/contracts";
import { SettlementListItem } from "@/components/dashboard/SettlementListItem";
import { SettlementSummary } from "@/components/dashboard/SettlementSummary";
import type { SettlementStatusTone } from "@/components/dashboard/SettlementStatusBadge";
import { buttonVariants } from "@/components/ui/button";

function settlementTone(status: string): SettlementStatusTone {
  if (status === "RELEASED") return "settled";
  if (status === "AVAILABLE") return "approvable";
  if (status === "ON_HOLD") return "hold";
  if (status === "ADJUSTED") return "adjusted";
  return "pending";
}

type CreatorSettlement = Awaited<ReturnType<typeof listCreatorSettlements>>[number];

function sourceLabel(sourceType: string | null) {
  switch (sourceType) {
    case "MEMBERSHIP":
      return "멤버십";
    case "POST":
      return "포스트";
    case "PROGRAM":
      return "프로그램";
    case "ARTWORK":
      return "작품";
    default:
      return "정산";
  }
}

function settlementTitle(settlement: CreatorSettlement) {
  const payment = settlement.payment;
  return (
    payment.membership?.plan.title ??
    payment.post?.title ??
    payment.programApplication?.program.title ??
    payment.artworkOrder?.artwork.title ??
    payment.contract?.application.program.title ??
    "정산 항목"
  );
}

function settlementParticipantName(settlement: CreatorSettlement) {
  const payment = settlement.payment;
  return (
    payment.programApplication?.user.name ??
    payment.artworkOrder?.fan.name ??
    payment.contract?.application.user.name ??
    payment.fan.name
  );
}

const ACTION_LABELS: Record<SettlementStatusTone, string> = {
  pending: "정산 예정",
  approvable: "정산 가능",
  settled: "정산 완료",
  hold: "보류 사유 확인",
  adjusted: "조정 반영",
};

/**
 * 크리에이터 정산 현황.
 * 팬 완료 승인 전에는 PENDING, 완료 승인 후에는 RELEASED 상태로 표시된다.
 */
export default async function CreatorSettlementsPage() {
  const user = await requireRole("CREATOR");
  if (!user.creatorProfile) {
    redirect("/dashboard/creator");
  }

  const settlements = await listCreatorSettlements(user.creatorProfile.id);
  const totalAmount = settlements.reduce(
    (sum, settlement) => sum + settlement.grossAmount,
    0,
  );
  const pendingSettlements = settlements.filter(
    (settlement) => settlement.status !== "RELEASED",
  );
  const settledSettlements = settlements.filter(
    (settlement) => settlement.status === "RELEASED",
  );
  const pendingAmount = pendingSettlements.reduce(
    (sum, settlement) => sum + settlement.payout,
    0,
  );
  const settledAmount = settledSettlements.reduce(
    (sum, settlement) => sum + settlement.payout,
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-text-default">
            정산 관리
          </h1>
          <p className="text-sm text-text-muted">
            멤버십, 포스트, 프로그램, 작품 판매 정산 상태를 확인하세요.
          </p>
        </div>
        <Link
          href="/dashboard/creator/payout-settings"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          정산 설정
        </Link>
      </header>

      <SettlementSummary
        totalAmount={totalAmount}
        totalCount={settlements.length}
        pendingAmount={pendingAmount}
        pendingCount={pendingSettlements.length}
        settledAmount={settledAmount}
        settledCount={settledSettlements.length}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-text-default">
            정산 목록
          </h2>
          <p className="text-[13px] text-text-muted">
            총 {settlements.length.toLocaleString("ko-KR")}건
          </p>
        </div>

        {settlements.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-border-default bg-white px-6 py-10 text-center">
            <p className="text-sm font-medium text-text-default">
              표시할 정산 내역이 없습니다.
            </p>
            <p className="mt-1 text-[13px] text-text-muted">
              결제가 완료되면 정산 내역이 이곳에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-border-default">
            {settlements.map((settlement, index) => {
              const tone = settlementTone(settlement.status);
              const title = `${sourceLabel(settlement.sourceType)} · ${settlementTitle(settlement)}`;
              const participantName = settlementParticipantName(settlement);

              return (
                <SettlementListItem
                  key={settlement.id}
                  programTitle={title}
                  participantName={participantName}
                  amount={settlement.payout}
                  status={tone}
                  actionLabel={ACTION_LABELS[tone]}
                  className={index > 0 ? "border-t-0" : undefined}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
