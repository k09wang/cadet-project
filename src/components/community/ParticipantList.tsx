"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * 프로그램 참여자 목록 + 에스크로 액션
 * (SPEC-007 FR-009 + SPEC-013 납품 요청·완료 승인·양방향 평가).
 *
 * 각 결제 완료 참여자에 대해:
 *  - 크리에이터: 개별 납품 요청(POST /api/applications/:id/request-delivery)
 *  - 완료 승인됨 + 미리뷰: 크리에이터 → 팬 리뷰(POST /api/programs/:id/reviews, revieweeId=팬)
 * 상태 배지: 결제 대기/완료 · 납품 요청됨 · 완료 승인됨.
 */
const PAID_STATUSES = ["PAID", "RELEASED"];

export interface ParticipantRow {
  id: string;
  user: { id: string; name: string };
  payment?: { status: string } | null;
  deliveryRequestedAt?: Date | null;
  completionApprovedAt?: Date | null;
}

interface ParticipantListProps {
  participants: ParticipantRow[];
  programId: string;
}

/** 참여자의 결제 완료 여부를 파생한다 (AC-007). */
export function isParticipantPaid(participant: ParticipantRow): boolean {
  return Boolean(participant.payment && PAID_STATUSES.includes(participant.payment.status));
}

function Badge({ tone, children }: { tone: "green" | "yellow" | "blue" | "slate"; children: React.ReactNode }) {
  const cls = {
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    slate: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${cls}`}>
      {children}
    </span>
  );
}

export function ParticipantList({ participants, programId }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        아직 참여자가 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {participants.map((participant) => (
        <ParticipantCard key={participant.id} participant={participant} programId={programId} />
      ))}
    </ul>
  );
}

function ParticipantCard({
  participant,
  programId,
}: {
  participant: ParticipantRow;
  programId: string;
}) {
  const paid = isParticipantPaid(participant);
  const deliveryRequested = !!participant.deliveryRequestedAt;
  const completionApproved = !!participant.completionApprovedAt;
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <li className="space-y-3 border rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium truncate">{participant.user.name}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={paid ? "green" : "yellow"}>
            {paid ? "결제 완료" : "결제 대기"}
          </Badge>
          {deliveryRequested ? <Badge tone="blue">납품 요청됨</Badge> : null}
          {completionApproved ? <Badge tone="green">완료 승인됨</Badge> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {paid && !deliveryRequested && (
          <RequestDeliveryButton applicationId={participant.id} />
        )}
        {completionApproved && (
          <Button size="sm" variant="outline" onClick={() => setReviewOpen((v) => !v)}>
            {reviewOpen ? "리뷰 닫기" : "리뷰 작성"}
          </Button>
        )}
      </div>

      {reviewOpen && completionApproved && (
        <CreatorReviewForm
          programId={programId}
          revieweeId={participant.user.id}
          revieweeName={participant.user.name}
          onDone={() => setReviewOpen(false)}
        />
      )}
    </li>
  );
}

function RequestDeliveryButton({ applicationId }: { applicationId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handle() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/request-delivery`, {
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
    return <span className="text-xs text-muted-foreground">납품 요청 완료</span>;
  }
  return (
    <>
      <Button size="sm" onClick={handle} disabled={pending}>
        {pending ? "처리 중..." : "납품 요청"}
      </Button>
      <span className="text-xs text-muted-foreground">이 참여자에게만 납품 요청합니다.</span>
      {error ? <p className="w-full text-xs text-destructive">{error}</p> : null}
    </>
  );
}

/** 크리에이터 → 팬 리뷰 인라인 폼 (SPEC-013 FR-013~FR-018). */
function CreatorReviewForm({
  programId,
  revieweeId,
  revieweeName,
  onDone,
}: {
  programId: string;
  revieweeId: string;
  revieweeName: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1 || rating > 5) {
      setError("별점은 1~5 사이여야 합니다.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/programs/${programId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          revieweeId,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "리뷰 작성에 실패했습니다.");
        return;
      }
      setDone(true);
      onDone();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return <p className="text-xs text-green-600 dark:text-green-400">{revieweeName}님 리뷰를 작성했습니다.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{revieweeName}님 평가</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`rounded border px-2 py-0.5 text-xs ${rating === n ? "border-primary bg-primary/10" : "border-input"}`}
          >
            {"★".repeat(n)}
          </button>
        ))}
      </div>
      <Input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        placeholder="코멘트 (선택)"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "작성 중..." : "리뷰 등록"}
      </Button>
    </form>
  );
}
