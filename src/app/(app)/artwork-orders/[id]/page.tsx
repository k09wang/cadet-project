import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getArtworkOrderForFan } from "@/lib/queries/artworks";
import { formatKrw } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { ArtworkIssueReporter } from "@/components/artworks/ArtworkIssueReporter";
import { ReceiveArtworkButton } from "@/components/artworks/ArtworkOrderActionButtons";

type PageProps = { params: Promise<{ id: string }> };

export default async function ArtworkOrderDetailPage({ params }: PageProps) {
  const [user, { id }] = await Promise.all([getCurrentUser(), params]);
  if (!user) {
    redirect("/login");
  }

  const order = await getArtworkOrderForFan(id, user.id);
  if (!order) {
    notFound();
  }

  const hasOpenIssue = order.issues.some((issue) =>
    ["OPEN", "REVIEWING"].includes(issue.status),
  );
  const canConfirmReceived = ["SHIPPED", "DELIVERED"].includes(order.status) && !hasOpenIssue;

  return (
    <main className="mx-auto max-w-3xl space-y-6 py-8">
      <header className="space-y-2">
        <p className="text-sm text-text-muted">
          {order.artwork.creatorProfile.studioName}
        </p>
        <h1 className="font-heading text-2xl font-bold text-text-default">
          {order.artwork.title}
        </h1>
      </header>

      <Card className="space-y-4 p-5">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-text-muted">주문 상태</span>
            <br />
            <span className="font-medium text-text-default">{order.status}</span>
          </p>
          <p>
            <span className="text-text-muted">결제 금액</span>
            <br />
            <span className="font-medium text-text-default">{formatKrw(order.totalAmount)}</span>
          </p>
          <p>
            <span className="text-text-muted">수령자</span>
            <br />
            <span className="font-medium text-text-default">{order.recipientName}</span>
          </p>
          <p>
            <span className="text-text-muted">연락처</span>
            <br />
            <span className="font-medium text-text-default">{order.recipientPhone}</span>
          </p>
          <p className="sm:col-span-2">
            <span className="text-text-muted">배송지</span>
            <br />
            <span className="font-medium text-text-default">{order.shippingAddress}</span>
          </p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border-default bg-neutral-50 p-4 text-sm">
          {order.shipment ? (
            <p>
              {order.shipment.carrier} · {order.shipment.trackingNo}
            </p>
          ) : (
            <p className="text-text-muted">아직 발송 전입니다.</p>
          )}
        </div>

        <ArtworkIssueReporter orderId={order.id} disabled={hasOpenIssue} />
        {canConfirmReceived ? (
          <ReceiveArtworkButton orderId={order.id} />
        ) : null}
      </Card>
    </main>
  );
}
