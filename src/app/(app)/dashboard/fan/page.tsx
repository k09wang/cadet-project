import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listMyApplications } from "@/lib/queries/applications";
import { listFanPayments } from "@/lib/queries/contracts";
import { listFanArtworkOrders } from "@/lib/queries/artworks";
import { listMyMemberships } from "@/lib/queries/members";
import {
  MyApplicationItem,
  type MyApplicationItemData,
} from "@/components/applications/MyApplicationItem";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatKrw } from "@/lib/format";

/**
 * 팬 홈 허브.
 * 신청, 주문, 멤버십, 결제 내역의 핵심 요약과 다음 이동 경로를 한 화면에서 연결한다.
 */
export default async function FanHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [applications, payments, artworkOrders, memberships] = await Promise.all([
    listMyApplications(user.id),
    listFanPayments(user.id),
    listFanArtworkOrders(user.id),
    listMyMemberships(user.id),
  ]);

  const activeApplications = applications.filter((application) =>
    ["ACCEPTED", "RESERVED", "PENDING_PAYMENT"].includes(application.status),
  );
  const recentPayments = payments.slice(0, 3);
  const recentOrders = artworkOrders.slice(0, 3);
  const totalPaid = payments
    .filter((payment) => payment.status === "PAID" || payment.status === "RELEASED")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <main className="mx-auto max-w-4xl space-y-8 py-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-text-default">
          내 홈
        </h1>
        <p className="text-sm text-text-muted">
          {user.name}님의 신청, 주문, 멤버십, 결제 내역을 한곳에서 확인하세요.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="프로그램 참여"
          value={activeApplications.length}
          href="/dashboard/fan/applications"
        />
        <SummaryCard label="작품 주문" value={artworkOrders.length} href="/dashboard/fan/artwork-orders" />
        <SummaryCard label="멤버십" value={memberships.length} href="/dashboard/fan/memberships" />
        <SummaryCard label="결제 합계" value={formatKrw(totalPaid)} href="/dashboard/fan/payments" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <HubLink
          href="/dashboard/fan/applications"
          title="내 신청 현황"
          description="프로그램 신청, 확정, 진행 상태를 확인합니다."
        />
        <HubLink
          href="/dashboard/fan/artwork-orders"
          title="작품 주문"
          description="배송 상태와 구매 취소·변경 요청을 관리합니다."
        />
        <HubLink
          href="/dashboard/fan/memberships"
          title="멤버십"
          description="가입한 멤버십과 취소 상태를 확인합니다."
        />
        <HubLink
          href="/dashboard/fan/bookmarks"
          title="관심 작가"
          description="북마크한 작가 스튜디오로 이동합니다."
        />
        <HubLink
          href="/dashboard/fan/profile"
          title="프로필"
          description="이름과 계정 정보를 관리합니다."
        />
        <HubLink
          href="/creators?tab=artworks"
          title="작품 구매"
          description="판매 중인 작품을 둘러봅니다."
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-text-default">
            프로그램 참여
          </h2>
          <Link
            href="/dashboard/fan/applications"
            className="text-xs text-text-muted hover:text-text-default"
          >
            전체 보기 →
          </Link>
        </div>
        {activeApplications.length === 0 ? (
          <Card className="px-5 py-6 text-sm text-text-muted">
            진행 중인 프로그램 참여가 없습니다.
          </Card>
        ) : (
          <ul className="space-y-3">
            {activeApplications.slice(0, 3).map((application) => (
              <MyApplicationItem
                key={application.id}
                application={application as MyApplicationItemData}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold text-text-default">
              최근 작품 주문
            </h2>
            <Link href="/dashboard/fan/artwork-orders" className="text-xs text-text-muted hover:text-text-default">
              전체 보기 →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-text-muted">작품 주문이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/artwork-orders/${order.id}`} className="min-w-0 truncate font-medium hover:underline">
                    {order.artwork.title}
                  </Link>
                  <span className="shrink-0 text-xs text-text-muted">{order.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold text-text-default">
              최근 결제 내역
            </h2>
            <Link href="/dashboard/fan/payments" className="text-xs text-text-muted hover:text-text-default">
              전체 보기 →
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-text-muted">결제 내역이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {recentPayments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium">{paymentTitle(payment)}</span>
                  <span className="shrink-0 text-xs text-text-muted">{formatKrw(payment.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/fan/payments" className={buttonVariants({ variant: "outline", size: "sm" })}>
            결제 내역 보기
          </Link>
        </Card>
      </section>
    </main>
  );
}

type FanPayment = Awaited<ReturnType<typeof listFanPayments>>[number];

function paymentTitle(payment: FanPayment) {
  return (
    payment.membership?.plan.title ??
    payment.post?.title ??
    payment.programApplication?.program.title ??
    payment.artworkOrder?.artwork.title ??
    payment.contract?.application.program.title ??
    "결제"
  );
}

function SummaryCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[12px] border border-border-default bg-white p-4 transition-colors hover:border-brand-primary hover:bg-brand-subtle"
    >
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-2 font-heading text-xl font-bold text-text-default">
        {typeof value === "number" ? value.toLocaleString("ko-KR") : value}
      </p>
    </Link>
  );
}

function HubLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border-default bg-white p-4 transition-colors hover:border-brand-primary hover:bg-brand-subtle"
    >
      <p className="text-sm font-semibold text-text-default">{title}</p>
      <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
    </Link>
  );
}
