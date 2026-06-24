import Link from "next/link";
import { notFound } from "next/navigation";
import { getMembershipPlanForCheckout } from "@/lib/queries/studio";
import { formatKrw } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { joinMembershipCheckoutAction } from "./actions";

type PageProps = {
  params: Promise<{ creatorId: string; planId: string }>;
};

export default async function MembershipCheckoutPage({ params }: PageProps) {
  const { creatorId, planId } = await params;
  const plan = await getMembershipPlanForCheckout(creatorId, planId);
  if (!plan) notFound();

  const feeKrw = Math.round(plan.priceKrw * 0.1);

  return (
    <main className="mx-auto max-w-3xl space-y-6 py-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-text-muted">
          {plan.creatorProfile.studioName}
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-text-default">
          멤버십 가입/결제
        </h1>
      </header>

      <div className="grid gap-5 md:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <Card className="space-y-3 p-5">
            <h2 className="font-heading text-lg font-semibold text-text-default">
              플랜 혜택
            </h2>
            <p className="text-sm leading-6 text-text-muted">
              {plan.description ?? "크리에이터가 공개한 멤버 전용 콘텐츠와 커뮤니티를 이용할 수 있습니다."}
            </p>
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="font-heading text-lg font-semibold text-text-default">
              결제 전 확인
            </h2>
            <ul className="space-y-2 text-sm leading-6 text-text-muted">
              <li>가입 즉시 30일 동안 멤버십 접근 권한이 활성화됩니다.</li>
              <li>결제 실패 시 멤버십 권한은 부여되지 않습니다.</li>
              <li>해지와 환불 정책은 크리에이터의 운영 정책을 따릅니다.</li>
            </ul>
          </Card>
        </section>

        <Card className="h-fit space-y-4 p-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-text-default">
              {plan.title}
            </h2>
            <p className="mt-1 text-sm text-text-muted">월 단위 멤버십</p>
          </div>
          <dl className="space-y-2 border-t border-border-default pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-text-muted">멤버십 금액</dt>
              <dd className="font-medium text-text-default">{formatKrw(plan.priceKrw)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-muted">플랫폼 수수료</dt>
              <dd className="font-medium text-text-default">{formatKrw(feeKrw)}</dd>
            </div>
            <div className="flex justify-between gap-3 pt-2 text-base">
              <dt className="font-semibold text-text-default">총 결제금액</dt>
              <dd className="font-bold text-brand-primary">{formatKrw(plan.priceKrw)}</dd>
            </div>
          </dl>
          <form action={joinMembershipCheckoutAction.bind(null, plan.id)} className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-text-default">
              <input required type="checkbox" className="size-4 accent-brand-primary" />
              플랜 혜택과 결제 조건을 확인했습니다.
            </label>
            <button type="submit" className={buttonVariants({ className: "w-full" })}>
              {plan.priceKrw.toLocaleString("ko-KR")}원 결제하기
            </button>
          </form>
          <Link
            href={`/creators/${creatorId}?tab=membership`}
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            스튜디오로 돌아가기
          </Link>
        </Card>
      </div>
    </main>
  );
}
