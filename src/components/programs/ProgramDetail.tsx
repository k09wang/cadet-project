import Link from "next/link";
import type { ProgramStatus } from "@prisma/client";
import { formatKrw } from "@/components/studio/MembershipPlanCardList";
import { ProgramStatusBadge } from "@/components/programs/ProgramStatusBadge";
import { ApplyButton } from "@/components/programs/ApplyButton";
import { ProgramReviewSection } from "@/components/programs/ProgramReviewSection";
import { ProgramFaqSection } from "@/components/programs/ProgramFaqSection";
import { Button, buttonVariants } from "@/components/ui/button";
import { effectiveStatus } from "@/lib/program-status";
import { formatDate, formatProgramPeriod } from "@/lib/format";
import type { ProgramReviewItem } from "@/lib/queries/reviews";

/**
 * 공개 프로그램 상세 (SPEC-004 FR-004, FR-005, AC-003, AC-006).
 * title, description, priceKrw, category, 기간, recruitDeadline, maxParticipants,
 * 현재 status(배지), 크리에이터 요약을 표시. RECRUITING 시 "참여 신청" CTA(SPEC-005에서 활성화).
 * SPEC-008: 하단에 완료 승인 / 리뷰 영역을 추가 (FR-001, FR-005, FR-011).
 */
export interface ProgramDetailItem {
  id: string;
  title: string;
  description?: string | null;
  priceKrw: number;
  category?: string | null;
  status: ProgramStatus;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  recruitDeadline?: Date | string | null;
  maxParticipants?: number | null;
  creatorProfile?: { id: string; studioName: string } | null;
  /** 현재 사용자의 신청 여부 (SPEC-005) */
  applied?: boolean;
  /** ACCEPTED 신청의 id — 결제 CTA 표시용 (C1 fix) */
  acceptedApplicationId?: string | null;
  /** 현재 사용자가 본인 프로그램인지 여부 (SPEC-005) */
  owner?: boolean;
  /** 리뷰 영역 데이터 (SPEC-008 + SPEC-013 에스크로/양방향). 누락 시 영역을 렌더하지 않는다. */
  review?: {
    canReview: boolean;
    alreadyReviewed: boolean;
    reviews: ProgramReviewItem[];
    avgRating: number | null;
    activeApplicationId?: string | null;
    deliveryRequested?: boolean;
    completionApproved?: boolean;
    participantName?: string | null;
    amountKrw?: number | null;
  };
}

export function ProgramDetail({ program }: { program: ProgramDetailItem }) {
  const status = effectiveStatus({
    status: program.status,
    recruitDeadline: program.recruitDeadline ? new Date(program.recruitDeadline) : null,
    startDate: program.startDate ? new Date(program.startDate) : null,
    endDate: program.endDate ? new Date(program.endDate) : null,
  });
  const period = formatProgramPeriod(program.startDate, program.endDate);
  const deadline = formatDate(program.recruitDeadline);
  const applied = program.applied ?? false;
  const acceptedApplicationId = program.acceptedApplicationId ?? null;
  const owner = program.owner ?? false;

  return (
    <article className="mx-auto max-w-[560px] space-y-6">
      <section className="overflow-hidden rounded-[var(--radius-card)] border border-border-default bg-white">
        <div className="h-[180px] bg-[#e0fbf9]" aria-hidden="true" />

        <div className="space-y-3 px-5 pb-5 pt-4">
          <header className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-heading text-lg font-bold leading-7 text-text-default">
                {program.title}
              </h1>
              <ProgramStatusBadge status={status} />
            </div>
            {program.creatorProfile ? (
              <Link
                href={`/creators/${program.creatorProfile.id}`}
                className="text-[13px] text-text-muted hover:text-brand-primary-pressed"
              >
                {program.creatorProfile.studioName}
              </Link>
            ) : null}
          </header>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium text-text-default">
            {program.maxParticipants != null ? (
              <span>정원 {program.maxParticipants}명</span>
            ) : null}
            {period ? <span>{period}</span> : null}
            <span className="font-bold">{formatKrw(program.priceKrw)}</span>
          </div>

          {program.description ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-text-default">
              {program.description}
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            {program.category ? (
              <>
                <dt className="text-text-muted">카테고리</dt>
                <dd className="text-text-default">{program.category}</dd>
              </>
            ) : null}

            {deadline ? (
              <>
                <dt className="text-text-muted">모집 마감일</dt>
                <dd className="text-text-default">{deadline}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </section>

      {status === "RECRUITING" && !applied && !owner ? (
        <div className="rounded-[var(--radius-card)] border border-border-default bg-white p-4">
          <Link
            href={`/programs/${program.id}/checkout`}
            className={buttonVariants({ className: "w-full" })}
          >
            {program.priceKrw > 0 ? "결제하고 신청하기" : "신청하기"}
          </Link>
        </div>
      ) : status === "RECRUITING" ? (
        <ApplyButton
          programId={program.id}
          applied={applied}
          recruiting={true}
          owner={owner}
          programTitle={program.title}
          creatorName={program.creatorProfile?.studioName ?? null}
          capacity={program.maxParticipants ?? null}
        />
      ) : acceptedApplicationId ? (
        <div className="space-y-2 rounded-[var(--radius-card)] border border-border-strong bg-brand-subtle p-4">
          <p className="text-sm font-semibold text-text-default">프로그램 참여가 확정되었습니다.</p>
          <p className="text-xs text-text-subtle">
            결제와 신청 상태는 마이페이지에서 확인할 수 있습니다.
          </p>
          <Link
            href="/dashboard/fan/payments"
            className={buttonVariants({ className: "w-full" })}
          >
            결제 내역 보기
          </Link>
          <p className="text-xs text-text-subtle">
            정원 내 결제 완료 기준으로 선착순 참여가 확정됩니다.
          </p>
        </div>
      ) : (
        <p className="rounded-[var(--radius-card)] border border-border-default bg-white p-4 text-sm text-text-muted">
          현재 모집 중이 아닙니다.
        </p>
      )}

      <ProgramFaqSection
        priceKrw={program.priceKrw}
        startDate={program.startDate}
        endDate={program.endDate}
        recruitDeadline={program.recruitDeadline}
        maxParticipants={program.maxParticipants}
      />

      {/* SPEC-005: 크리에이터 본인인 경우 신청 관리 링크 추가 (선택) */}
      {owner && (
        <Link href={`/dashboard/creator/programs/${program.id}/applications`}>
          <Button variant="outline" size="sm" className="w-full">
            신청 관리
          </Button>
        </Link>
      )}

      {/* SPEC-008/013: 에스크로 완료 / 리뷰 영역 */}
      {program.review ? (
        <ProgramReviewSection
          programId={program.id}
          status={program.status}
          owner={owner}
          canReview={program.review.canReview}
          alreadyReviewed={program.review.alreadyReviewed}
          reviews={program.review.reviews}
          avgRating={program.review.avgRating}
          activeApplicationId={program.review.activeApplicationId ?? null}
          deliveryRequested={program.review.deliveryRequested}
          completionApproved={program.review.completionApproved}
          participantName={program.review.participantName ?? null}
          amountKrw={program.review.amountKrw ?? null}
        />
      ) : null}
    </article>
  );
}
