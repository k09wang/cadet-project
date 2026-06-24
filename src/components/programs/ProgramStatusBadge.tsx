import type { ProgramStatus } from "@prisma/client";
import { PROGRAM_STATUS_LABELS } from "@/lib/program-status";
import { Badge, type BadgeProps } from "@/components/ui/badge";

/**
 * 프로그램 상태 배지 (SPEC-004 FR-004, AC-003, AC-005, AC-006).
 * 호출자는 effectiveStatus()로 평가한 상태를 넘긴다.
 */
const STATUS_VARIANTS: Record<ProgramStatus, BadgeProps["variant"]> = {
  DRAFT: "secondary",
  RECRUITING: "default",
  CLOSED: "warning",
  CONTRACTING: "info",
  IN_PROGRESS: "program",
  COMPLETED: "membership",
  CANCELLED: "danger",
};

export function ProgramStatusBadge({
  status,
  className,
}: {
  status: ProgramStatus;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className={className}>
      {PROGRAM_STATUS_LABELS[status]}
    </Badge>
  );
}
