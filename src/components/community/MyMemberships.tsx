/**
 * 팬 본인의 멤버십 목록 (SPEC-007 FR-011, AC-008).
 * 크리에이터명(studioName), 플랜명, 가입일을 표시한다.
 */
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { CancelMembershipButton } from "@/components/community/CancelMembershipButton";

interface MyMembershipRow {
  id: string;
  status?: string;
  startedAt: Date | string;
  cancelledAt?: Date | string | null;
  plan: {
    id: string;
    title: string;
    creatorProfile: { id: string; studioName: string };
  };
}

interface MyMembershipsProps {
  memberships: MyMembershipRow[];
}

export function MyMemberships({ memberships }: MyMembershipsProps) {
  if (memberships.length === 0) {
    return (
      <div className="space-y-4 rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          가입한 멤버십이 없습니다. 관심 있는 작가의 멤버십을 둘러보세요.
        </p>
        <Link
          href="/creators"
          className={buttonVariants({ variant: "outline" })}
        >
          작가 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {memberships.map((membership) => (
        <li
          key={membership.id}
          className="flex items-center justify-between gap-4 border rounded-lg p-4"
        >
          <div className="min-w-0">
            <p className="font-medium truncate">
              {membership.plan.creatorProfile.studioName}
            </p>
            <p className="text-sm text-muted-foreground">{membership.plan.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              상태: {membership.status === "CANCELLED" ? "취소됨" : "활성"}
              {membership.cancelledAt ? ` · ${formatDate(membership.cancelledAt)} 취소` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <p className="text-xs text-muted-foreground">
              {formatDate(membership.startedAt)} 가입
            </p>
            {membership.status === "ACTIVE" || !membership.status ? (
              <CancelMembershipButton membershipId={membership.id} />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
