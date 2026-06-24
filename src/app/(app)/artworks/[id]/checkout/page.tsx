import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtworkForCheckout } from "@/lib/queries/artworks";
import { formatKrw } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { purchaseArtworkAction } from "@/app/(app)/creators/[creatorId]/actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ArtworkCheckoutPage({ params }: PageProps) {
  const { id } = await params;
  const artwork = await getArtworkForCheckout(id);
  if (!artwork) notFound();

  const shippingFeeKrw = 0;
  const totalAmount = artwork.priceKrw + shippingFeeKrw;

  return (
    <main className="mx-auto max-w-4xl space-y-6 py-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-text-muted">
          {artwork.creatorProfile.studioName}
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-text-default">
          작품 주문/결제
        </h1>
      </header>

      <form
        action={purchaseArtworkAction.bind(null, artwork.id)}
        className="grid gap-5 lg:grid-cols-[1fr_360px]"
      >
        <section className="space-y-4">
          <Card className="space-y-4 p-5">
            <h2 className="font-heading text-lg font-semibold text-text-default">
              배송 정보
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="recipientName"
                required
                placeholder="수령자"
                className="h-11 rounded-lg border border-border-default px-3 text-sm"
              />
              <input
                name="recipientPhone"
                required
                placeholder="연락처"
                className="h-11 rounded-lg border border-border-default px-3 text-sm"
              />
            </div>
            <input
              name="shippingAddress"
              required
              placeholder="배송지"
              className="h-11 w-full rounded-lg border border-border-default px-3 text-sm"
            />
            <input
              name="shippingMemo"
              placeholder="배송 요청사항"
              className="h-11 w-full rounded-lg border border-border-default px-3 text-sm"
            />
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="font-heading text-lg font-semibold text-text-default">
              에스크로 결제 안내
            </h2>
            <p className="text-sm leading-6 text-text-muted">
              결제금은 수령 확인 전까지 보관됩니다. 발송 이후 주문 상세에서 배송 상태를 확인하고,
              문제가 있으면 문제 신고를 접수할 수 있습니다.
            </p>
            <label className="flex items-center gap-2 text-sm text-text-default">
              <input required type="checkbox" className="size-4 accent-brand-primary" />
              주문 정보와 취소/환불 기준을 확인했습니다.
            </label>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card className="overflow-hidden">
            {artwork.imageUrl ? (
              <div
                role="img"
                aria-label={artwork.title}
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${artwork.imageUrl})` }}
              />
            ) : null}
            <div className="space-y-3 p-5">
              <div>
                <h2 className="font-heading text-lg font-semibold text-text-default">
                  {artwork.title}
                </h2>
                {artwork.description ? (
                  <p className="mt-2 line-clamp-4 text-sm leading-6 text-text-muted">
                    {artwork.description}
                  </p>
                ) : null}
              </div>
              <dl className="space-y-2 border-t border-border-default pt-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">작품 금액</dt>
                  <dd className="font-medium text-text-default">{formatKrw(artwork.priceKrw)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-text-muted">배송비</dt>
                  <dd className="font-medium text-text-default">{formatKrw(shippingFeeKrw)}</dd>
                </div>
                <div className="flex justify-between gap-3 pt-2 text-base">
                  <dt className="font-semibold text-text-default">총 결제금액</dt>
                  <dd className="font-bold text-brand-primary">{formatKrw(totalAmount)}</dd>
                </div>
              </dl>
              <button type="submit" className={buttonVariants({ className: "w-full" })}>
                {totalAmount.toLocaleString("ko-KR")}원 결제하기
              </button>
              <Link
                href={`/creators/${artwork.creatorProfile.id}?tab=artworks`}
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                작품으로 돌아가기
              </Link>
            </div>
          </Card>
        </aside>
      </form>
    </main>
  );
}
