import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * 멤버십 플랜 카드 목록 (SPEC-002 FR-005, SPEC-003 FR-003, FR-006, AC-003).
 * isActiveMember: 현재 사용자가 이미 이 크리에이터의 멤버인지 여부.
 * joinAction: 각 플랜 가입 시 호출할 Server Action (planId => void).
 * - isActiveMember true → "멤버십 가입 완료" 비활성 버튼
 * - isActiveMember false → "멤버십 가입하기" 활성 버튼
 */
export interface MembershipPlanCardListProps {
  plans: Array<{
    id: string;
    title: string;
    description?: string | null;
    priceKrw: number;
  }>;
  isActiveMember: boolean;
  joinAction?: (planId: string) => Promise<void>;
  creatorProfileId?: string;
}

export function formatKrw(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

export function MembershipPlanCardList({
  plans,
  isActiveMember,
  joinAction,
  creatorProfileId,
}: MembershipPlanCardListProps) {
  if (plans.length === 0) {
    return <p className="text-sm text-text-muted">아직 멤버십 플랜이 없습니다.</p>;
  }
  return (
    <ul className="grid gap-3">
      {plans.map((plan) => (
        <li key={plan.id}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{plan.title}</CardTitle>
                <Badge variant="membership">멤버십</Badge>
              </div>
            </CardHeader>
            {plan.description ? (
              <CardContent>
                <p className="text-sm leading-5 text-text-muted">{plan.description}</p>
              </CardContent>
            ) : null}
            <CardFooter className="flex items-center justify-between">
              <span className="text-sm font-bold text-text-default">{formatKrw(plan.priceKrw)}</span>
              {isActiveMember ? (
                <Button size="sm" disabled>
                  멤버십 가입 완료
                </Button>
              ) : creatorProfileId ? (
                <Link
                  href={`/creators/${creatorProfileId}/memberships/${plan.id}/checkout`}
                  className={buttonVariants({ size: "sm" })}
                >
                  멤버십 가입하기
                </Link>
              ) : joinAction ? (
                <form action={joinAction.bind(null, plan.id)}>
                  <Button type="submit" size="sm">
                    멤버십 가입하기
                  </Button>
                </form>
              ) : (
                <Button size="sm">
                  멤버십 가입하기
                </Button>
              )}
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  );
}
