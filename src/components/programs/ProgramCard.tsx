import Link from "next/link";
import type { ProgramStatus } from "@prisma/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatKrw } from "@/components/studio/MembershipPlanCardList";
import { ProgramStatusBadge } from "@/components/programs/ProgramStatusBadge";
import { effectiveStatus } from "@/lib/program-status";
import { formatProgramPeriod } from "@/lib/format";

/**
 * 공개 프로그램 카드 (SPEC-004 FR-003, 7장 ProgramCard).
 * 제목, 크리에이터, 가격, 모집 상태 배지, 기간을 표시한다.
 * status는 effectiveStatus()로 모집 마감을 반영한다 (FR-005).
 */
export interface ProgramCardItem {
  id: string;
  title: string;
  priceKrw: number;
  category?: string | null;
  status: ProgramStatus;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  recruitDeadline?: Date | string | null;
  creatorProfile?: { id: string; studioName: string } | null;
}

export function ProgramCard({ program }: { program: ProgramCardItem }) {
  const status = effectiveStatus({
    status: program.status,
    recruitDeadline: program.recruitDeadline ? new Date(program.recruitDeadline) : null,
    startDate: program.startDate ? new Date(program.startDate) : null,
    endDate: program.endDate ? new Date(program.endDate) : null,
  });
  const period = formatProgramPeriod(program.startDate, program.endDate);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="line-clamp-2">
            <Link href={`/programs/${program.id}`} className="transition-colors hover:text-brand-primary-pressed">
              {program.title}
            </Link>
          </CardTitle>
          <ProgramStatusBadge status={status} />
        </div>
        {program.creatorProfile ? (
          <p className="text-xs text-text-muted">{program.creatorProfile.studioName}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {program.category ? (
          <Badge variant="program" className="w-fit">
            {program.category}
          </Badge>
        ) : null}
        {period ? <p className="text-xs text-text-muted">{period}</p> : null}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-text-default">{formatKrw(program.priceKrw)}</span>
        <Link
          href={`/programs/${program.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          자세히 보기
        </Link>
      </CardFooter>
    </Card>
  );
}
