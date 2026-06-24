import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { listCreatorArtworkOrders } from "@/lib/queries/artworks";
import { formatKrw } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { ShipmentForm } from "@/components/artworks/ShipmentForm";
import { CreatorArtworkOrderActions } from "@/components/artworks/ArtworkOrderActionButtons";

export default async function CreatorArtworkOrdersPage() {
  const user = await requireRole("CREATOR");
  if (!user.creatorProfile) {
    redirect("/dashboard/creator");
  }

  const orders = await listCreatorArtworkOrders(user.creatorProfile.id);

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-text-default">
          작품 주문 관리
        </h1>
        <p className="text-sm text-text-muted">
          결제된 작품 주문의 배송 상태를 관리하세요.
        </p>
      </header>

      {orders.length === 0 ? (
        <Card className="px-6 py-10 text-center">
          <p className="text-sm font-medium text-text-default">작품 주문이 없습니다.</p>
          <p className="mt-1 text-[13px] text-text-muted">
            작품이 판매되면 이곳에 주문이 표시됩니다.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const canShip = order.status === "PAID" || order.status === "PREPARING";
            const openIssue = order.issues.find((issue) =>
              ["OPEN", "REVIEWING"].includes(issue.status),
            );
            const canRefund = !["CANCELLED", "REFUNDED", "RECEIVED"].includes(order.status);

            return (
              <li key={order.id}>
                <Card className="space-y-4 p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <p className="font-medium text-text-default">{order.artwork.title}</p>
                      <p className="text-sm text-text-muted">
                        {order.fan.name} · {formatKrw(order.totalAmount)} · {order.status}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {order.recipientName} · {order.recipientPhone} · {order.shippingAddress}
                      </p>
                      {order.shipment ? (
                        <p className="mt-1 text-xs text-text-muted">
                          {order.shipment.carrier} {order.shipment.trackingNo}
                        </p>
                      ) : null}
                      {openIssue ? (
                        <p className="mt-1 text-xs font-medium text-danger">
                          문제 신고: {openIssue.type}
                        </p>
                      ) : null}
                    </div>
                    <span className="h-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-text-muted">
                      {order.payment?.settlement?.status ?? "정산 대기"}
                    </span>
                  </div>

                  {canShip ? (
                    <ShipmentForm orderId={order.id} />
                  ) : (
                    <p className="text-xs text-text-muted">현재 상태에서는 발송 처리가 필요하지 않습니다.</p>
                  )}
                  <CreatorArtworkOrderActions
                    orderId={order.id}
                    canRefund={canRefund}
                    canResolveIssue={Boolean(openIssue)}
                  />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
