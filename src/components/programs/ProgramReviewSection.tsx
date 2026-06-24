import type { ProgramStatus } from "@prisma/client";
import type { ProgramReviewItem } from "@/lib/queries/reviews";
import { ReviewList } from "@/components/programs/ReviewList";
import { ReviewForm } from "@/components/programs/ReviewForm";
import { CompleteButton } from "@/components/programs/CompleteButton";
import { ApproveCompletionButton } from "@/components/programs/ApproveCompletionButton";

/**
 * 프로그램 에스크로/리뷰 통합 영역
 * (SPEC-008 골격 + SPEC-013 에스크로 순서·양방향 평가).
 *
 * - 크리에이터 본인 + IN_PROGRESS: 일괄 납품 요청 버튼 (FR-001).
 * - 참여자(팬) + 납품 요청 수신 + 미승인: 완료 승인 버튼 (FR-006~FR-011).
 * - COMPLETED + 완료 승인된 참여자: 리뷰 작성 폼 (FR-012~FR-018).
 * - 항상: 리뷰 목록 + 평균 평점 (FR-011, FR-012).
 */
export function ProgramReviewSection({
  programId,
  status,
  owner,
  canReview,
  alreadyReviewed,
  reviews,
  avgRating,
  activeApplicationId,
  deliveryRequested,
  completionApproved,
  participantName,
  amountKrw,
}: {
  programId: string;
  status: ProgramStatus;
  owner: boolean;
  canReview: boolean;
  alreadyReviewed: boolean;
  reviews: ProgramReviewItem[];
  avgRating: number | null;
  /** 현재 사용자(팬)의 활성 참여 id — 완료 승인 버튼용. */
  activeApplicationId?: string | null;
  /** 해당 참여의 납품 요청 수신 여부. */
  deliveryRequested?: boolean;
  /** 해당 참여의 완료 승인 여부. */
  completionApproved?: boolean;
  /** 완료 승인 다이얼로그에 표시할 참여자명(팬 본인). */
  participantName?: string | null;
  /** 완료 승인 다이얼로그에 표시할 거래금액(계약 합의금액). */
  amountKrw?: number | null;
}) {
  const fanPendingApproval =
    !!activeApplicationId && !!deliveryRequested && !completionApproved;

  return (
    <div className="space-y-6">
      {owner && status === "IN_PROGRESS" ? (
        <CompleteButton programId={programId} />
      ) : null}

      {fanPendingApproval ? (
        <ApproveCompletionButton
          applicationId={activeApplicationId!}
          participantName={participantName}
          amountKrw={amountKrw}
        />
      ) : null}

      {completionApproved && !alreadyReviewed ? (
        <p className="text-sm text-muted-foreground">
          완료 승인이 처리되었습니다. 리뷰를 남겨주세요.
        </p>
      ) : null}

      <ReviewList reviews={reviews} avgRating={avgRating} />

      {status === "COMPLETED" && canReview ? (
        <ReviewForm programId={programId} alreadyReviewed={alreadyReviewed} />
      ) : null}
    </div>
  );
}
