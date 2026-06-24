import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFanPaymentReceipt } from "@/lib/queries/contracts";
import { formatDateTime, formatKrw } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string }>;
};

type ReceiptPayment = NonNullable<Awaited<ReturnType<typeof getFanPaymentReceipt>>>;

function paymentTitle(payment: ReceiptPayment) {
  return (
    payment.membership?.plan.title ??
    payment.post?.title ??
    payment.programApplication?.program.title ??
    payment.artworkOrder?.artwork.title ??
    payment.contract?.application.program.title ??
    "결제"
  );
}

function sellerName(payment: ReceiptPayment) {
  return (
    payment.membership?.plan.creatorProfile.studioName ??
    payment.post?.creatorProfile.studioName ??
    payment.programApplication?.program.creatorProfile.studioName ??
    payment.artworkOrder?.artwork.creatorProfile.studioName ??
    payment.contract?.application.program.creatorProfile.studioName ??
    "ArtBridge"
  );
}

function paymentKind(payment: ReceiptPayment) {
  if (payment.membership) return "멤버십";
  if (payment.post) return "포스트";
  if (payment.programApplication) return "프로그램";
  if (payment.artworkOrder) return "작품";
  if (payment.contract) return "프로그램";
  return "기타";
}

export default async function FanPaymentReceiptPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const payment = await getFanPaymentReceipt(id, user.id);
  if (!payment) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-6 py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-text-default">
            결제 영수증
          </h1>
          <p className="text-sm text-text-muted">
            결제번호 {payment.id}
          </p>
        </div>
        <Link href="/dashboard/fan/payments" className={buttonVariants({ variant: "outline", size: "sm" })}>
          결제 내역
        </Link>
      </header>

      <Card className="space-y-5 p-6">
        <section className="space-y-1">
          <p className="text-xs font-medium text-text-muted">{paymentKind(payment)}</p>
          <h2 className="font-heading text-xl font-semibold text-text-default">
            {paymentTitle(payment)}
          </h2>
          <p className="text-sm text-text-muted">{sellerName(payment)}</p>
        </section>

        <dl className="grid gap-3 border-t border-border-default pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">구매자</dt>
            <dd className="text-right font-medium text-text-default">
              {payment.fan.name} {payment.fan.email ? `(${payment.fan.email})` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">결제일</dt>
            <dd className="text-right font-medium text-text-default">
              {formatDateTime(payment.createdAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">결제 상태</dt>
            <dd className="text-right font-medium text-text-default">{payment.status}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">공급가</dt>
            <dd className="text-right font-medium text-text-default">{formatKrw(payment.amount - payment.feeKrw)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">수수료</dt>
            <dd className="text-right font-medium text-text-default">{formatKrw(payment.feeKrw)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border-default pt-3 text-base">
            <dt className="font-semibold text-text-default">총 결제금액</dt>
            <dd className="text-right font-bold text-brand-primary">{formatKrw(payment.amount)}</dd>
          </div>
        </dl>

        <p className="rounded-lg bg-neutral-50 px-4 py-3 text-xs leading-5 text-text-muted">
          본 화면은 ArtBridge MVP용 결제 확인 영수증입니다. 실제 세금계산서 또는 현금영수증 발행은 결제 연동 단계에서 확장됩니다.
        </p>
      </Card>
    </main>
  );
}
