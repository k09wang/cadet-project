"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CancelMembershipButtonProps {
  membershipId: string;
}

export function CancelMembershipButton({ membershipId }: CancelMembershipButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cancel() {
    const confirmed = window.confirm("멤버십을 취소할까요?");
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/memberships/${membershipId}/cancel`, {
        method: "PATCH",
      });
      if (!response.ok) {
        setError("멤버십 취소에 실패했습니다.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <Button type="button" size="xs" variant="outline" disabled={isPending} onClick={cancel}>
        {isPending ? "취소 중" : "멤버십 취소"}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
