/**
 * 팬 본인의 멤버십 목록 (SPEC-007 FR-011, AC-008).
 * 크리에이터명(studioName), 플랜명, 가입일을 표시한다.
 */
interface MyMembershipRow {
  id: string;
  startedAt: Date | string;
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
      <p className="text-center text-sm text-muted-foreground py-8">
        가입한 멤버십이 없습니다.
      </p>
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
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            {new Date(membership.startedAt).toLocaleDateString("ko-KR")} 가입
          </p>
        </li>
      ))}
    </ul>
  );
}
