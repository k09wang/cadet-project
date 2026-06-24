import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listFanArtworkOrders } from "@/lib/queries/artworks";
import { formatKrw } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ArtworkIssueReporter } from "@/components/artworks/ArtworkIssueReporter";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "결제 대기",
  PAID: "결제 완료",
  PREPARING: "배송 준비",
  SHIPPED: "배송 중",
  RECEIVED: "수령 완료",
  CANCELLED: "취소",
  REFUNDED: "환불",
  ISSUE_OPENED: "문제 접수",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "결제 대기",
  PAID: "결제 완료",
  RELEASED: "결제 완료",
  REFUNDED: "환불",
  FAILED: "실패",
};

function shipmentText(order: Awaited<ReturnType<typeof listFanArtworkOrders>>[number]) {
  if (!order.shipment) return "발송 대기";
  return `${order.shipment.carrier} ${order.shipment.trackingNo}`;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function hasRequestIssue(order: Awaited<ReturnType<typeof listFanArtworkOrders>>[number]) {
  return order.issues.some((issue) =>
    ["OPEN", "REVIEWING"].includes(issue.status) ||
    ["REFUND_REQUEST", "OTHER"].includes(issue.type),
  );
}

export default async function FanArtworkOrdersPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [orders, params] = await Promise.all([
    listFanArtworkOrders(user.id),
    searchParams,
  ]);
  const activeTab = firstParam(params?.tab) ?? "all";
  const shippingOrders = orders.filter((order) =>
    ["PAID", "PREPARING", "SHIPPED", "DELIVERED"].includes(order.status),
  );
  const requestOrders = orders.filter(hasRequestIssue);
  const filteredOrders =
    activeTab === "shipping"
      ? shippingOrders
      : activeTab === "requests"
        ? requestOrders
        : orders;

  return (
    <main className="mx-auto max-w-3xl space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-text-default">
          작품 주문 내역
        </h1>
        <p className="text-sm text-text-muted">
          구매한 작품의 결제, 발송, 수령 상태를 확인하세요.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        <Link href="/dashboard/fan" className={buttonVariants({ variant: "outline", size: "sm" })}>
          마이페이지
        </Link>
        <Link href="/dashboard/fan/payments" className={buttonVariants({ variant: "outline", size: "sm" })}>
          프로그램·결제
        </Link>
        <Link href="/dashboard/fan/memberships" className={buttonVariants({ variant: "outline", size: "sm" })}>
          멤버십
        </Link>
      </nav>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {[
          { href: "/dashboard/fan/artwork-orders", label: "전체", id: "all", count: orders.length },
          {
            href: "/dashboard/fan/artwork-orders?tab=shipping",
            label: "배송 진행",
            id: "shipping",
            count: shippingOrders.length,
          },
          {
            href: "/dashboard/fan/artwork-orders?tab=requests",
            label: "취소/변경 요청",
            id: "requests",
            count: requestOrders.length,
          },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={buttonVariants({
              variant: activeTab === tab.id ? "default" : "outline",
              size: "sm",
            })}
          >
            {tab.label} {tab.count.toLocaleString("ko-KR")}
          </Link>
        ))}
      </nav>

      {filteredOrders.length === 0 ? (
        <Card className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-text-default">
            {orders.length === 0 ? "아직 구매한 작품이 없습니다." : "표시할 작품 주문이 없습니다."}
          </p>
          <p className="mt-1 text-[13px] text-text-muted">
            관심 있는 작가의 스튜디오에서 판매 작품을 둘러보세요.
          </p>
          <Link
            href="/creators?tab=artworks"
            className={buttonVariants({ className: "mt-4", size: "sm" })}
          >
            작품 보러가기
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filteredOrders.map((order) => {
            const issue = order.issues[0];
            const hasOpenIssue = issue && ["OPEN", "REVIEWING"].includes(issue.status);
            const canRequestCancel = !["SHIPPED", "DELIVERED", "RECEIVED", "REFUNDED", "CANCELLED"].includes(order.status);
            const canRequestChange = ["PAID", "PREPARING"].includes(order.status);

            return (
              <li key={order.id}>
                <Card className="space-y-4 p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                    <div className="min-w-0 space-y-2">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-text-muted">
                          {order.artwork.creatorProfile.studioName}
                        </p>
                        <Link
                          href={`/artwork-orders/${order.id}`}
                          className="block font-medium text-text-default underline-offset-4 hover:underline"
                        >
                          {order.artwork.title}
                        </Link>
                        <p className="text-sm text-text-muted">
                          {formatKrw(order.totalAmount)} ·{" "}
                          {PAYMENT_STATUS_LABELS[order.payment?.status ?? ""] ?? "결제 정보 없음"}
                        </p>
                      </div>
                      <dl className="grid gap-1 text-xs text-text-muted sm:grid-cols-2">
                        <div>
                          <dt className="font-medium text-text-default">배송</dt>
                          <dd>{shipmentText(order)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-text-default">수령자</dt>
                          <dd>
                            {order.recipientName} · {order.recipientPhone}
                          </dd>
                        </div>
                      </dl>
                      {issue ? (
                        <p className="text-xs font-medium text-danger">
                          문제 신고: {issue.type} · {issue.status}
                        </p>
                      ) : null}
                    </div>
                    <span className="h-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-text-muted">
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/artwork-orders/${order.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      상세 보기
                    </Link>
                    <ArtworkIssueReporter orderId={order.id} disabled={Boolean(hasOpenIssue)} />
                    <ArtworkIssueReporter
                      orderId={order.id}
                      disabled={Boolean(hasOpenIssue) || !canRequestCancel}
                      type="REFUND_REQUEST"
                      label="구매 취소 요청"
                      title="취소 요청 사유"
                      placeholder="취소 사유를 입력해 주세요."
                      successMessage="구매 취소 요청이 접수되었습니다."
                    />
                    <ArtworkIssueReporter
                      orderId={order.id}
                      disabled={Boolean(hasOpenIssue) || !canRequestChange}
                      type="OTHER"
                      label="변경 요청"
                      title="변경 요청 내용"
                      placeholder="배송지, 연락처, 요청사항 변경 내용을 입력해 주세요."
                      successMessage="변경 요청이 접수되었습니다."
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
