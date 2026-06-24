import { prisma } from "@/lib/prisma";
import { buildNotificationMessage, notificationHref } from "@/lib/notification-types";
import { resolvePaymentProvider } from "@/lib/payment/provider";

const FEE_RATE = 0.1;
const ARTWORK_PAYMENT_RESERVATION_MINUTES = 15;

export type ArtworkOrderServiceContext = {
  userId: string;
};

export type ArtworkOrderInput = {
  artworkId: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  shippingMemo?: string;
  shippingFeeKrw?: number;
};

export type ArtworkOrderServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400 | 403 | 404 | 409 | 500; error: string };

class StockUnavailableError extends Error {}

export async function purchaseArtwork(
  ctx: ArtworkOrderServiceContext,
  input: ArtworkOrderInput,
): Promise<
  ArtworkOrderServiceResult<{
    orderId: string;
    paymentId: string;
    settlementId: string | null;
    status: string;
    amount: number;
    feeKrw: number;
    provider: string;
    merchantUid: string;
    paymentParams: Record<string, string>;
  }>
> {
  const artwork = await prisma.artwork.findUnique({
    where: { id: input.artworkId },
    include: { creatorProfile: { select: { userId: true } } },
  });

  if (!artwork || artwork.status !== "PUBLISHED") {
    return { ok: false, status: 404, error: "Artwork not found" };
  }
  if (artwork.creatorProfile.userId === ctx.userId) {
    return { ok: false, status: 400, error: "Cannot purchase your own artwork" };
  }
  if (artwork.priceKrw <= 0) {
    return { ok: false, status: 400, error: "Artwork must have a positive price" };
  }
  if (artwork.stock <= 0) {
    return { ok: false, status: 409, error: "Artwork is sold out" };
  }

  const shippingFeeKrw = input.shippingFeeKrw ?? 0;
  if (shippingFeeKrw < 0) {
    return { ok: false, status: 400, error: "Shipping fee cannot be negative" };
  }

  const amount = artwork.priceKrw + shippingFeeKrw;
  const feeKrw = Math.round(amount * FEE_RATE);
  const payout = amount - feeKrw;
  const provider = resolvePaymentProvider();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.artworkInventoryReservation.create({
        data: {
          artworkId: artwork.id,
          userId: ctx.userId,
          status: provider.name === "mock" ? "CONVERTED" : "ACTIVE",
          expiresAt: new Date(Date.now() + ARTWORK_PAYMENT_RESERVATION_MINUTES * 60 * 1000),
        },
      });

      const order = await tx.artworkOrder.create({
        data: {
          artworkId: artwork.id,
          fanUserId: ctx.userId,
          status: provider.name === "mock" ? "PAID" : "PENDING_PAYMENT",
          recipientName: input.recipientName,
          recipientPhone: input.recipientPhone,
          shippingAddress: input.shippingAddress,
          shippingMemo: input.shippingMemo,
          itemAmount: artwork.priceKrw,
          shippingFeeKrw,
          totalAmount: amount,
          paidAt: provider.name === "mock" ? new Date() : null,
        },
      });

      const request = provider.createRequest({
        artworkOrderId: order.id,
        amount,
        productName: artwork.title,
      });

      if (provider.name !== "mock") {
        const payment = await tx.payment.create({
          data: {
            artworkOrderId: order.id,
            fanUserId: ctx.userId,
            amount,
            feeKrw,
            status: "PENDING",
            provider: provider.name,
            merchantUid: request.merchantUid,
          },
        });
        return {
          orderId: order.id,
          paymentId: payment.id,
          settlementId: null,
          status: order.status,
          provider: provider.name,
          merchantUid: request.merchantUid,
          paymentParams: request.paymentParams,
          reservationId: reservation.id,
        };
      }

      const stockUpdate = await tx.artwork.updateMany({
        where: { id: artwork.id, stock: { gt: 0 }, status: "PUBLISHED" },
        data: {
          stock: { decrement: 1 },
          status: artwork.stock === 1 ? "SOLD" : "PUBLISHED",
        },
      });
      if (stockUpdate.count !== 1) {
        throw new StockUnavailableError("Artwork is sold out");
      }

      const charge = await provider.charge({ artworkOrderId: order.id, amount });
      if (!charge.success) {
        throw new Error("Payment charge failed");
      }

      const payment = await tx.payment.create({
        data: {
          artworkOrderId: order.id,
          fanUserId: ctx.userId,
          amount,
          feeKrw,
          status: "PAID",
          provider: provider.name,
          providerTxId: charge.providerTxId,
          merchantUid: request.merchantUid,
        },
      });
      const settlement = await tx.settlement.create({
        data: {
          paymentId: payment.id,
          sourceType: "ARTWORK",
          sourceId: artwork.id,
          grossAmount: amount,
          feeKrw,
          payout,
          status: "PENDING",
        },
      });
      await tx.notification.createMany({
        data: [
          {
            userId: ctx.userId,
            type: "ARTWORK_ORDER_PAID",
            message: buildNotificationMessage("ARTWORK_ORDER_PAID", {}),
            linkUrl: notificationHref("ARTWORK_ORDER_PAID", { artworkOrderId: order.id }),
          },
          {
            userId: artwork.creatorProfile.userId,
            type: "ARTWORK_ORDER_PAID",
            message: buildNotificationMessage("ARTWORK_ORDER_PAID", {}),
            linkUrl: notificationHref("ARTWORK_ORDER_PAID", { artworkOrderId: order.id }),
          },
        ],
      });

      return {
        orderId: order.id,
        paymentId: payment.id,
        settlementId: settlement.id,
        status: order.status,
        provider: provider.name,
        merchantUid: request.merchantUid,
        paymentParams: request.paymentParams,
        reservationId: reservation.id,
      };
    });

    return { ok: true, data: { ...result, amount, feeKrw } };
  } catch (err) {
    if (err instanceof StockUnavailableError) {
      return { ok: false, status: 409, error: "Artwork is sold out" };
    }
    return { ok: false, status: 500, error: "Artwork purchase transaction failed" };
  }
}
