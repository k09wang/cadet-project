import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getContractDetail } from "@/lib/queries/contracts";
import { ContractDetail } from "@/components/contracts/ContractDetail";
import { AGREEMENT_TEXT, deriveAmountState } from "@/lib/contracts";

const FEE_RATE = 0.1;

/**
 * 계약 상세 페이지 (SPEC-006 + SPEC-011 금액 조율·양측 서명 + SPEC-012 PG 결제).
 *
 * 팬 본인 또는 크리에이터 소유자만 접근 가능. 그 외에는 404로 존재를 숨긴다.
 * 금액 조율 상태(terms 파생), 양측 서명 여부, 결제 완료 여부를 계산해 전달한다.
 */
export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    notFound();
  }

  const contract = await getContractDetail(id);
  if (!contract) {
    notFound();
  }

  const fanUserId = contract.application.userId;
  const creatorUserId = contract.application.program.creatorProfile.userId;

  const isFan = user.id === fanUserId;
  const isCreatorOwner = user.id === creatorUserId;
  if (!isFan && !isCreatorOwner) {
    // 접근 권한 없음 — 존재 자체를 노출하지 않는다 (FR-011)
    notFound();
  }

  const basePrice = contract.application.program.priceKrw;
  const amountState = deriveAmountState(contract.terms);
  // 표시 금액: 합의/제시 금액 우선, 없으면 원가
  const displayAmount = contract.agreedAmount > 0 ? contract.agreedAmount : basePrice;
  const feeKrw = Math.round(displayAmount * FEE_RATE);
  const payout = displayAmount - feeKrw;
  const paid = contract.payments.some(
    (p) => p.status === "PAID" || p.status === "RELEASED",
  );

  return (
    <div className="mx-auto max-w-xl py-6">
      <ContractDetail
        contractId={contract.id}
        programTitle={contract.application.program.title}
        basePrice={basePrice}
        proposedAmount={contract.agreedAmount}
        feeKrw={feeKrw}
        payout={payout}
        agreementText={AGREEMENT_TEXT}
        fanName={contract.application.user.name}
        creatorName={contract.application.program.creatorProfile.studioName}
        amountState={amountState}
        fanSigned={contract.fanSignedAt != null}
        creatorSigned={contract.creatorSignedAt != null}
        paid={paid}
        viewer={isFan ? "fan" : "creator"}
      />
    </div>
  );
}
