"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatKrw } from "@/lib/format";

/**
 * 계약 상세 + 금액 조율/양측 서명/PG 결제 UI
 * (SPEC-006 골격 + SPEC-011 금액 조율·양측 서명 + SPEC-012 PG 결제).
 *
 * 금액 조율(SPEC-011):
 *  - 크리에이터(소유자): 금액 제안(PATCH /amount). proposed 상태.
 *  - 팬: 제안 수락(PATCH /amount/agree → agreed) 또는 거부(PATCH /amount/reject → 결렬).
 * 양측 서명(SPEC-011 FR-012~FR-015):
 *  - 팬 서명(PATCH /sign) + 크리에이터 서명(PATCH /sign/creator). 둘 다 완료 시 결제 잠금 해제.
 * 결제(SPEC-012): 양측 서명 + 금액 합의 후 팬이 결제(POST /payment). Mock 폴백이 기본.
 *
 * ServiceResult 에러(status)별 한국어 메시지 매핑.
 */
export interface ContractDetailProps {
  contractId: string;
  programTitle: string;
  /** 기본 프로그램 가격(조율 전 원가). */
  basePrice: number;
  /** 현재 제시/합의 금액(agreedAmount). */
  proposedAmount: number;
  feeKrw: number;
  payout: number;
  agreementText: string;
  fanName: string;
  creatorName: string;
  amountState: { proposed: boolean; agreed: boolean; rejected: boolean };
  fanSigned: boolean;
  creatorSigned: boolean;
  paid: boolean;
  viewer: "fan" | "creator";
}

function errorMessage(status: number, fallback: string): string {
  if (status === 400) return "잘못된 요청입니다. 입력값을 확인해 주세요.";
  if (status === 403) return "권한이 없습니다.";
  if (status === 404) return "대상을 찾을 수 없습니다.";
  if (status === 409) return "이미 처리된 항목입니다.";
  return fallback;
}

async function callApi(
  url: string,
  method: string,
  body: unknown,
  setError: (m: string | null) => void,
  okFallback: string,
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError(errorMessage(res.status, okFallback));
      return false;
    }
    return true;
  } catch {
    setError("네트워크 오류가 발생했습니다.");
    return false;
  }
}

export function ContractDetail(props: ContractDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [proposeValue, setProposeValue] = useState<string>(
    String(props.proposedAmount > 0 ? props.proposedAmount : props.basePrice),
  );

  const isFan = props.viewer === "fan";
  const isCreator = props.viewer === "creator";

  const refresh = () => router.refresh();

  // ── 금액 조율 (SPEC-011) ──
  const handlePropose = () => {
    setError(null);
    const amount = Number(proposeValue);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError("금액은 양의 정수여야 합니다.");
      return;
    }
    startTransition(async () => {
      const ok = await callApi(
        `/api/contracts/${props.contractId}/amount`,
        "PATCH",
        { amount },
        setError,
        "금액 제안 중 오류가 발생했습니다.",
      );
      if (ok) refresh();
    });
  };

  const handleAgree = () => {
    setError(null);
    startTransition(async () => {
      const ok = await callApi(
        `/api/contracts/${props.contractId}/amount/agree`,
        "PATCH",
        { agreed: true },
        setError,
        "금액 수락 중 오류가 발생했습니다.",
      );
      if (ok) refresh();
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      const ok = await callApi(
        `/api/contracts/${props.contractId}/amount/reject`,
        "PATCH",
        { agreed: false },
        setError,
        "금액 거부 중 오류가 발생했습니다.",
      );
      if (ok) refresh();
    });
  };

  // ── 서명 (SPEC-011 FR-012~FR-015) ──
  const handleFanSign = () => {
    setError(null);
    startTransition(async () => {
      const ok = await callApi(
        `/api/contracts/${props.contractId}/sign`,
        "PATCH",
        { agreed: true },
        setError,
        "서명 중 오류가 발생했습니다.",
      );
      if (ok) refresh();
    });
  };

  const handleCreatorSign = () => {
    setError(null);
    startTransition(async () => {
      const ok = await callApi(
        `/api/contracts/${props.contractId}/sign/creator`,
        "PATCH",
        { agreed: true },
        setError,
        "서명 중 오류가 발생했습니다.",
      );
      if (ok) refresh();
    });
  };

  // ── 결제 (SPEC-012) ──
  const handlePay = () => {
    setError(null);
    startTransition(async () => {
      const ok = await callApi(
        `/api/contracts/${props.contractId}/payment`,
        "POST",
        { provider: "mock" },
        setError,
        "결제 중 오류가 발생했습니다.",
      );
      if (ok) refresh();
    });
  };

  // 서명 가능 조건: 금액이 제시되지 않았거나, 제시된 금액에 합의된 경우.
  // API(signContract FR-014)와 동일한 규칙: proposed && !agreed && !rejected 상태만 차단.
  const canSign =
    !props.amountState.proposed ||
    (props.amountState.agreed && !props.amountState.rejected);
  const bothSigned = props.fanSigned && props.creatorSigned;
  const displayAmount = props.proposedAmount > 0 ? props.proposedAmount : props.basePrice;

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <div>
          <h1 className="text-xl font-semibold">{props.programTitle}</h1>
          <p className="text-sm text-muted-foreground">참여 계약</p>
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted-foreground">크리에이터</dt>
          <dd className="text-right">{props.creatorName}</dd>
          <dt className="text-muted-foreground">참여자</dt>
          <dd className="text-right">{props.fanName}</dd>
          <dt className="text-muted-foreground">계약 금액</dt>
          <dd className="text-right font-medium">{formatKrw(displayAmount)}</dd>
        </dl>

        <div className="rounded border border-border bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
          {props.agreementText}
        </div>
      </Card>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      {/* 금액 조율 섹션 (SPEC-011) */}
      {props.paid ? null : (
        <AmountSection
          isCreator={isCreator}
          isFan={isFan}
          state={props.amountState}
          proposedAmount={props.proposedAmount}
          basePrice={props.basePrice}
          proposeValue={proposeValue}
          setProposeValue={setProposeValue}
          onPropose={handlePropose}
          onAgree={handleAgree}
          onReject={handleReject}
          disabled={isPending}
        />
      )}

      {props.paid ? (
        <PaymentSuccessCard amount={displayAmount} feeKrw={props.feeKrw} payout={props.payout} />
      ) : (
        <Card className="space-y-4 p-6">
          {/* 서명 섹션 (SPEC-011 양측 서명) */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">전자 서명</h2>
            <SignatureRow
              label="참여자(팬) 서명"
              done={props.fanSigned}
              canAct={isFan && canSign}
              actionLabel="동의하고 서명"
              agreed={agreed}
              setAgreed={setAgreed}
              onSign={handleFanSign}
              disabled={isPending}
            />
            <SignatureRow
              label="크리에이터 서명"
              done={props.creatorSigned}
              canAct={isCreator && canSign}
              actionLabel="서명하기"
              agreed={true}
              setAgreed={() => {}}
              onSign={handleCreatorSign}
              disabled={isPending}
            />
            {props.amountState.proposed && !props.amountState.agreed && !props.amountState.rejected && (
              <p className="text-xs text-muted-foreground">
                제시된 금액에 동의한 후 서명할 수 있습니다.
              </p>
            )}
          </div>

          {/* 결제 (SPEC-012) — 양측 서명 완료 + 팬만 */}
          <div className="border-t border-border pt-4">
            {isFan ? (
              <Button
                onClick={handlePay}
                disabled={!bothSigned || !canSign || isPending}
              >
                {isPending ? "처리 중..." : "결제하기"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                결제는 참여자(팬)가 진행합니다.
              </p>
            )}
            {!bothSigned && (
              <p className="mt-2 text-xs text-muted-foreground">
                양측 서명이 완료되면 결제가 가능합니다.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

/** 금액 조율 상태 배지. */
function AmountStateBadge({ state }: { state: { proposed: boolean; agreed: boolean; rejected: boolean } }) {
  let label = "대기";
  let color = "text-muted-foreground";
  if (state.rejected) {
    label = "결렬";
    color = "text-destructive";
  } else if (state.agreed) {
    label = "합의 완료";
    color = "text-green-600 dark:text-green-400";
  } else if (state.proposed) {
    label = "제안 대기";
    color = "text-amber-600 dark:text-amber-400";
  }
  return <span className={`text-xs font-medium ${color}`}>· {label}</span>;
}

function AmountSection(props: {
  isCreator: boolean;
  isFan: boolean;
  state: { proposed: boolean; agreed: boolean; rejected: boolean };
  proposedAmount: number;
  basePrice: number;
  proposeValue: string;
  setProposeValue: (v: string) => void;
  onPropose: () => void;
  onAgree: () => void;
  onReject: () => void;
  disabled: boolean;
}) {
  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">금액 조율</h2>
        <AmountStateBadge state={props.state} />
      </div>

      {props.state.rejected ? (
        <p className="text-sm text-destructive">
          금액 협의가 결렬되었습니다. 신청이 거부되고 프로그램은 모집 중으로 돌아갑니다.
        </p>
      ) : props.state.agreed ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          합의 금액 {formatKrw(props.proposedAmount)}로 확정되었습니다.
        </p>
      ) : props.isCreator ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            참여자에게 제시할 금액을 입력하세요. (원가 {formatKrw(props.basePrice)})
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              step={1}
              value={props.proposeValue}
              onChange={(e) => props.setProposeValue(e.target.value)}
              className="w-40 rounded border border-border bg-background px-3 py-2 text-sm"
            />
            <Button onClick={props.onPropose} disabled={props.disabled}>
              {props.disabled ? "처리 중..." : "금액 제안"}
            </Button>
          </div>
        </div>
      ) : props.state.proposed ? (
        <div className="space-y-2">
          <p className="text-sm">
            크리에이터가 <span className="font-medium">{formatKrw(props.proposedAmount)}</span>을(를) 제시했습니다.
          </p>
          <div className="flex gap-2">
            <Button onClick={props.onAgree} disabled={props.disabled}>
              {props.disabled ? "처리 중..." : "수락"}
            </Button>
            <Button onClick={props.onReject} variant="outline" disabled={props.disabled}>
              거부(결렬)
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          크리에이터가 금액을 제시할 때까지 대기 중입니다.
        </p>
      )}
    </Card>
  );
}

/** 양측 서명 행 — 역할별 체크박스 + 서명 버튼. */
function SignatureRow(props: {
  label: string;
  done: boolean;
  canAct: boolean;
  actionLabel: string;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  onSign: () => void;
  disabled: boolean;
}) {
  if (props.done) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span>{props.label}</span>
        <span className="text-green-600 dark:text-green-400">서명 완료</span>
      </div>
    );
  }
  if (!props.canAct) {
    return (
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{props.label}</span>
        <span>대기 중</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={props.agreed}
          onChange={(e) => props.setAgreed(e.target.checked)}
        />
        <span>{props.label}</span>
      </div>
      <Button onClick={props.onSign} disabled={!props.agreed || props.disabled} size="sm">
        {props.disabled ? "처리 중..." : props.actionLabel}
      </Button>
    </div>
  );
}

/** 결제 완료 카드 — 금액/수수료/정산 예정액 (FR-010, AC-004). */
function PaymentSuccessCard({
  amount,
  feeKrw,
  payout,
}: {
  amount: number;
  feeKrw: number;
  payout: number;
}) {
  return (
    <Card className="space-y-3 border-green-200 bg-green-50 p-6 dark:border-green-900/40 dark:bg-green-900/10">
      <h2 className="font-semibold text-green-700 dark:text-green-400">결제가 완료되었습니다</h2>
      <dl className="grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-muted-foreground">결제 금액</dt>
        <dd className="text-right">{formatKrw(amount)}</dd>
        <dt className="text-muted-foreground">플랫폼 수수료 (10%)</dt>
        <dd className="text-right">{formatKrw(feeKrw)}</dd>
        <dt className="text-muted-foreground">크리에이터 정산 예정액</dt>
        <dd className="text-right font-medium">{formatKrw(payout)}</dd>
      </dl>
      <p className="text-xs text-muted-foreground">
        에스크로 진행 — 크리에이터의 납품 요청 후 참여자가 완료를 승인하면 정산이 확정됩니다.
      </p>
    </Card>
  );
}
