"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type ActionState = "idle" | "pending" | "error" | "success";

export function ReceiveArtworkButton({ orderId, disabled }: { orderId: string; disabled?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>("idle");

  async function confirmReceived() {
    setState("pending");
    const res = await fetch(`/api/artwork-orders/${orderId}/received`, { method: "POST" });
    if (res.ok) {
      setState("success");
      router.refresh();
      return;
    }
    setState("error");
  }

  return (
    <div className="grid gap-2">
      <Button type="button" size="sm" disabled={disabled || state === "pending"} onClick={confirmReceived}>
        <CheckCircle2 className="size-4" />
        {state === "pending" ? "확인 중" : "수령 완료"}
      </Button>
      {state === "error" ? <p className="text-xs text-danger">수령 확인에 실패했습니다.</p> : null}
    </div>
  );
}

export function CreatorArtworkOrderActions({
  orderId,
  canRefund,
  canResolveIssue,
}: {
  orderId: string;
  canRefund: boolean;
  canResolveIssue: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>("idle");

  async function postAction(url: string, body: Record<string, string>) {
    setState("pending");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setState("success");
      router.refresh();
      return;
    }
    setState("error");
  }

  async function resolveIssue() {
    await postAction(`/api/artwork-orders/${orderId}/issues/resolve`, {
      resolutionNote: "크리에이터가 문제 해결을 확인했습니다.",
    });
  }

  async function refundOrder() {
    const reason = window.prompt("환불 사유를 입력해 주세요.");
    if (!reason?.trim()) return;
    await postAction(`/api/artwork-orders/${orderId}/refund`, { reason });
  }

  if (!canRefund && !canResolveIssue) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canResolveIssue ? (
        <Button type="button" size="sm" variant="outline" disabled={state === "pending"} onClick={resolveIssue}>
          <ShieldCheck className="size-4" />
          {state === "pending" ? "처리 중" : "이슈 해결"}
        </Button>
      ) : null}
      {canRefund ? (
        <Button type="button" size="sm" variant="destructive" disabled={state === "pending"} onClick={refundOrder}>
          <RotateCcw className="size-4" />
          {state === "pending" ? "처리 중" : "환불 처리"}
        </Button>
      ) : null}
      {state === "error" ? <p className="basis-full text-xs text-danger">주문 처리에 실패했습니다.</p> : null}
    </div>
  );
}
