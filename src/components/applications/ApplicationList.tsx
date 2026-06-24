"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

/**
 * 신청 상태 배지 스타일 (SPEC-005 FR-003).
 */
const statusStyles: Record<string, string> = {
  PENDING: "bg-[#fff7e6] text-[#b77900]",
  PENDING_PAYMENT: "bg-[#fff7e6] text-[#b77900]",
  ACCEPTED: "bg-[#ecfdf3] text-[#047857]",
  REJECTED: "bg-danger/10 text-danger",
  AUTO_REJECTED: "bg-neutral-100 text-text-muted",
  CANCELLED: "bg-neutral-100 text-text-muted",
  REMOVED: "bg-danger/10 text-danger",
  PAYMENT_FAILED: "bg-danger/10 text-danger",
};

// 신청 상태 → 한국어 라벨 (영문 enum 노출 방지 — 시각적/UX 개선).
export const applicationStatusLabels: Record<string, string> = {
  PENDING: "신청 대기",
  PENDING_PAYMENT: "결제 대기",
  ACCEPTED: "확정",
  REJECTED: "거절",
  AUTO_REJECTED: "자동 거절",
  CANCELLED: "팬 취소",
  REMOVED: "제외됨",
  PAYMENT_FAILED: "결제 실패",
};

/**
 * 크리에이터 프로그램 신청 목록 (SPEC-005 FR-002, AC-003, AC-004).
 */
interface ApplicationListProps {
  programId: string;
  applications: Array<{
    id: string;
    userId: string;
    status: string;
    message?: string | null;
    createdAt: Date | string;
    user: {
      id: string;
      name: string;
    };
  }>;
}

export function ApplicationList({ applications }: ApplicationListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const handleRemove = async (applicationId: string) => {
    setFeedback((prev) => ({ ...prev, [applicationId]: "" }));

    startTransition(async () => {
      try {
        const response = await fetch(`/api/applications/${applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "remove",
            removedReason: "크리에이터가 프로그램 신청 관리에서 멤버를 제외했습니다.",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setFeedback((prev) => ({
            ...prev,
            [applicationId]: data.error || "처리 중 오류가 발생했습니다.",
          }));
          return;
        }

        setFeedback((prev) => ({
          ...prev,
          [applicationId]: "멤버가 제외되었습니다.",
        }));
        router.refresh();
      } catch {
        setFeedback((prev) => ({
          ...prev,
          [applicationId]: "네트워크 오류가 발생했습니다.",
        }));
      }
    });
  };

  if (applications.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border-default bg-white px-6 py-10 text-center">
        <p className="text-sm font-medium text-text-default">아직 신청이 없습니다.</p>
        <p className="mt-1 text-[13px] text-text-muted">
          신청과 결제가 완료된 멤버가 생기면 이곳에서 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <div
          key={application.id}
          className="rounded-[var(--radius-card)] border border-border-default bg-white p-5 shadow-[var(--elevation-1)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-text-default">
                  {application.user.name}
                </h3>
                <Badge
                  variant="secondary"
                  className={cn("font-medium", statusStyles[application.status])}
                >
                  {applicationStatusLabels[application.status] || application.status}
                </Badge>
              </div>
              {application.message ? (
                <p className="line-clamp-2 text-sm leading-6 text-text-subtle">
                  {application.message}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-text-muted">
                {formatDateTime(application.createdAt)}
              </p>
            </div>

            {application.status === "ACCEPTED" && (
              <div className="flex shrink-0 flex-col gap-2 sm:items-end sm:pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleRemove(application.id)}
                >
                  멤버 제외
                </Button>
                <p className="text-xs text-text-muted">
                  제외 시 결제/정산 상태가 함께 정리됩니다.
                </p>
              </div>
            )}
          </div>

          {feedback[application.id] && (
            <p
              className={cn(
                "mt-3 rounded-[var(--radius-control)] px-3 py-2 text-sm",
                feedback[application.id].includes("제외")
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger",
              )}
            >
              {feedback[application.id]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
