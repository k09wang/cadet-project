import Link from "next/link";
import type { ProgramStatus } from "@prisma/client";
import { formatKrw } from "@/components/studio/MembershipPlanCardList";
import { ProgramStatusBadge } from "@/components/programs/ProgramStatusBadge";
import { ApplyButton } from "@/components/programs/ApplyButton";
import { Button } from "@/components/ui/button";
import { effectiveStatus } from "@/lib/program-status";
import { formatDate, formatProgramPeriod } from "@/lib/format";

/**
 * 공개 프로그램 상세 (SPEC-004 FR-004, FR-005, AC-003, AC-006).
 * title, description, priceKrw, category, 기간, recruitDeadline, maxParticipants,
 * 현재 status(배지), 크리에이터 요약을 표시. RECRUITING 시 "참여 신청" CTA(SPEC-005에서 활성화).
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
  /** 현재 사용자가 본인 프로그램인지 여부 (SPEC-005) */
  owner?: boolean;
}

export function ProgramDetail({ program }: { program: ProgramDetailItem }) {
  const status = effectiveStatus({
    status: program.status,
    recruitDeadline: program.recruitDeadline ? new Date(program.recruitDeadline) : null,
  });
  const period = formatProgramPeriod(program.startDate, program.endDate);
  const deadline = formatDate(program.recruitDeadline);
  const applied = program.applied ?? false;
  const owner = program.owner ?? false;

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">{program.title}</h1>
          <ProgramStatusBadge status={status} />
        </div>
        {program.creatorProfile ? (
          <Link
            href={`/creators/${program.creatorProfile.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {program.creatorProfile.studioName}
          </Link>
        ) : null}
      </header>

      {program.description ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{program.description}</p>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <dt className="text-muted-foreground">가격</dt>
        <dd className="font-medium">{formatKrw(program.priceKrw)}</dd>

        {program.category ? (
          <>
            <dt className="text-muted-foreground">카테고리</dt>
            <dd>{program.category}</dd>
          </>
        ) : null}

        {period ? (
          <>
            <dt className="text-muted-foreground">기간</dt>
            <dd>{period}</dd>
          </>
        ) : null}

        {deadline ? (
          <>
            <dt className="text-muted-foreground">모집 마감일</dt>
            <dd>{deadline}</dd>
          </>
        ) : null}

        {program.maxParticipants != null ? (
          <>
            <dt className="text-muted-foreground">모집 인원</dt>
            <dd>{program.maxParticipants}명</dd>
          </>
        ) : null}
      </dl>

      {status === "RECRUITING" ? (
        <ApplyButton
          programId={program.id}
          applied={applied}
          recruiting={true}
          owner={owner}
        />
      ) : (
        <p className="text-sm text-muted-foreground">현재 모집 중이 아닙니다.</p>
      )}

      {/* SPEC-005: 크리에이터 본인인 경우 신청 관리 링크 추가 (선택) */}
      {owner && (
        <Link href={`/dashboard/creator/programs/${program.id}/applications`}>
          <Button variant="outline" size="sm" className="w-full">
            신청 관리
          </Button>
        </Link>
      )}
    </article>
  );
}
