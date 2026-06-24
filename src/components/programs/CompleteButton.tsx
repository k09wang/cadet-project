"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * 프로그램 일괄 납품 요청 버튼 — 크리에이터(소유자)용
 * (SPEC-008 라우트 호환 + SPEC-013 에스크로 순서 재정의).
 *
 * IN_PROGRESS 프로그램에서 결제 완료(PAID) 참여 중 아직 납품 요청되지 않은
 * 참여에 일괄 납품 요청을 보낸다. 완료 승인은 각 팬이 참여 단위로 수행한다(SPEC-013).
 * 클릭 시 POST /api/programs/:id/complete 호출.
 */
export function CompleteButton({ programId }: { programId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleComplete() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/programs/${programId}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "납품 요청에 실패했습니다.");
        return;
      }
      setDone(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-muted-foreground">
        참여자에게 납품 요청을 보냈습니다. 각 참여자가 완료를 승인하면 정산이 확정됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleComplete}
        disabled={pending}
        className="w-full"
      >
        {pending ? "처리 중..." : "참여자에게 납품 요청"}
      </Button>
      <p className="text-xs text-muted-foreground">결제 완료된 모든 참여자에게 한 번에 납품 요청을 보냅니다.</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
