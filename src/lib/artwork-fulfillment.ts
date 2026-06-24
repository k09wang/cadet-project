import { prisma } from "@/lib/prisma";
import { buildNotificationMessage, notificationHref } from "@/lib/notification-types";

export type ArtworkFulfillmentContext = {
  userId: string;
  role: string;
  creatorProfileId: string | null | undefined;
};

export type ShipArtworkOrderInput = {
  carrier: string;
  trackingNo: string;
  shippedAt?: Date;
};

export type ReportArtworkIssueInput = {
  type:
    | "NOT_DELIVERED"
    | "DAMAGED"
    | "WRONG_ITEM"
    | "NOT_AS_DESCRIBED"
    | "REFUND_REQUEST"
    | "OTHER";
  message: string;
  imageUrl?: string;
};

export type RefundArtworkOrderInput = {
  reason: string;
};

export type ResolveArtworkIssueInput = {
  resolutionNote?: string;
};

export type ArtworkFulfillmentResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400 | 403 | 404 | 409 | 500; error: string };

export async function shipArtworkOrder(
  ctx: ArtworkFulfillmentContext,
  orderId: string,
  input: ShipArtworkOrderInput,
): Promise<ArtworkFulfillmentResult<{ orderId: string; status: string; shipmentId: string }>> {
  if (ctx.role !== "CREATOR" || !ctx.creatorProfileId) {
    return { ok: false, status: 403, error: "Forbidden: CREATOR role required" };
  }

  const order = await prisma.artworkOrder.findUnique({
    where: { id: orderId },
    include: { artwork: true },
  });
  if (!order) {
    return { ok: false, status: 404, error: "Artwork order not found" };
  }
  if (order.artwork.creatorProfileId !== ctx.creatorProfileId) {
    return { ok: false, status: 403, error: "Forbidden: not the artwork owner" };
  }
  if (!["PAID", "PREPARING"].includes(order.status)) {
    return { ok: false, status: 400, error: "Artwork order cannot be shipped" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const shipment = await tx.artworkShipment.upsert({
        where: { orderId },
        create: {
          orderId,
          carrier: input.carrier,
          trackingNo: input.trackingNo,
          shippedAt: input.shippedAt ?? new Date(),
        },
        update: {
          carrier: input.carrier,
          trackingNo: input.trackingNo,
          shippedAt: input.shippedAt ?? new Date(),
        },
      });
      const updatedOrder = await tx.artworkOrder.update({
        where: { id: orderId },
        data: { status: "SHIPPED" },
      });
      await tx.notification.create({
        data: {
          userId: order.fanUserId,
          type: "ARTWORK_SHIPPED",
          message: buildNotificationMessage("ARTWORK_SHIPPED", {}),
          linkUrl: notificationHref("ARTWORK_SHIPPED", { artworkOrderId: orderId }),
        },
      });
      return {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        shipmentId: shipment.id,
      };
    });
    return { ok: true, data: result };
  } catch {
    return { ok: false, status: 500, error: "Artwork shipment failed" };
  }
}

export async function markArtworkOrderReceived(
  ctx: ArtworkFulfillmentContext,
  orderId: string,
): Promise<ArtworkFulfillmentResult<{ orderId: string; status: string; settlementStatus?: string }>> {
  const order = await prisma.artworkOrder.findUnique({
    where: { id: orderId },
    include: {
      artwork: { include: { creatorProfile: { select: { userId: true } } } },
      payment: { include: { settlement: true } },
      shipment: true,
    },
  });
  if (!order) {
    return { ok: false, status: 404, error: "Artwork order not found" };
  }
  if (order.fanUserId !== ctx.userId) {
    return { ok: false, status: 403, error: "Forbidden: only the buyer can confirm receipt" };
  }
  if (!["SHIPPED", "DELIVERED"].includes(order.status)) {
    return { ok: false, status: 400, error: "Artwork order cannot be received" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const updatedOrder = await tx.artworkOrder.update({
        where: { id: orderId },
        data: { status: "RECEIVED", receivedAt: now },
      });
      if (order.shipment) {
        await tx.artworkShipment.update({
          where: { orderId },
          data: { deliveredAt: order.shipment.deliveredAt ?? now },
        });
      }
      let settlementStatus: string | undefined;
      if (order.payment?.settlement) {
        const settlement = await tx.settlement.update({
          where: { id: order.payment.settlement.id },
          data: {
            status: "AVAILABLE",
            availableAt: order.payment.settlement.availableAt ?? now,
            heldReason: null,
          },
        });
        settlementStatus = settlement.status;
        await tx.notification.create({
          data: {
            userId: order.artwork.creatorProfile.userId,
            type: "SETTLEMENT_AVAILABLE",
            message: buildNotificationMessage("SETTLEMENT_AVAILABLE", {}),
            linkUrl: notificationHref("SETTLEMENT_AVAILABLE", { settlementId: settlement.id }),
          },
        });
      }
      await tx.notification.create({
        data: {
          userId: order.artwork.creatorProfile.userId,
          type: "ARTWORK_ORDER_RECEIVED",
          message: buildNotificationMessage("ARTWORK_ORDER_RECEIVED", {}),
          linkUrl: notificationHref("ARTWORK_ORDER_RECEIVED", { artworkOrderId: orderId }),
        },
      });
      return { orderId: updatedOrder.id, status: updatedOrder.status, settlementStatus };
    });
    return { ok: true, data: result };
  } catch {
    return { ok: false, status: 500, error: "Artwork receipt confirmation failed" };
  }
}

export async function refundArtworkOrder(
  ctx: ArtworkFulfillmentContext,
  orderId: string,
  input: RefundArtworkOrderInput,
): Promise<ArtworkFulfillmentResult<{ orderId: string; status: string; paymentStatus?: string; settlementStatus?: string }>> {
  if (ctx.role !== "CREATOR" || !ctx.creatorProfileId) {
    return { ok: false, status: 403, error: "Forbidden: CREATOR role required" };
  }

  const order = await prisma.artworkOrder.findUnique({
    where: { id: orderId },
    include: {
      artwork: { include: { creatorProfile: { select: { userId: true } } } },
      payment: { include: { settlement: true } },
    },
  });
  if (!order) {
    return { ok: false, status: 404, error: "Artwork order not found" };
  }
  if (order.artwork.creatorProfileId !== ctx.creatorProfileId) {
    return { ok: false, status: 403, error: "Forbidden: not the artwork owner" };
  }
  if (["CANCELLED", "REFUNDED", "RECEIVED"].includes(order.status)) {
    return { ok: false, status: 400, error: "Artwork order cannot be refunded" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const updatedOrder = await tx.artworkOrder.update({
        where: { id: orderId },
        data: { status: "REFUNDED", cancelledAt: now, refundReason: input.reason },
      });

      let paymentStatus: string | undefined;
      if (order.payment) {
        const payment = await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "REFUNDED" },
        });
        paymentStatus = payment.status;
      }

      let settlementStatus: string | undefined;
      if (order.payment?.settlement) {
        const settlement = await tx.settlement.update({
          where: { id: order.payment.settlement.id },
          data: {
            status: "ADJUSTED",
            payout: 0,
            heldReason: `Refunded: ${input.reason}`,
          },
        });
        settlementStatus = settlement.status;
        if (order.payment.settlement.payout !== 0) {
          await tx.settlementAdjustment.create({
            data: {
              settlementId: settlement.id,
              type: "REFUND_DEDUCTION",
              amount: -order.payment.settlement.payout,
              reason: input.reason,
            },
          });
        }
      }

      if (["PAID", "PREPARING"].includes(order.status)) {
        await tx.artwork.update({
          where: { id: order.artworkId },
          data: { stock: { increment: 1 }, status: "PUBLISHED" },
        });
      }

      await tx.notification.create({
        data: {
          userId: order.fanUserId,
          type: "ARTWORK_ORDER_REFUNDED",
          message: buildNotificationMessage("ARTWORK_ORDER_REFUNDED", {}),
          linkUrl: notificationHref("ARTWORK_ORDER_REFUNDED", { artworkOrderId: orderId }),
        },
      });

      return { orderId: updatedOrder.id, status: updatedOrder.status, paymentStatus, settlementStatus };
    });
    return { ok: true, data: result };
  } catch {
    return { ok: false, status: 500, error: "Artwork refund failed" };
  }
}

export async function resolveArtworkOrderIssue(
  ctx: ArtworkFulfillmentContext,
  orderId: string,
  _input: ResolveArtworkIssueInput,
): Promise<ArtworkFulfillmentResult<{ orderId: string; status: string; resolvedIssueCount: number; settlementStatus?: string }>> {
  if (ctx.role !== "CREATOR" || !ctx.creatorProfileId) {
    return { ok: false, status: 403, error: "Forbidden: CREATOR role required" };
  }

  const order = await prisma.artworkOrder.findUnique({
    where: { id: orderId },
    include: {
      artwork: true,
      payment: { include: { settlement: true } },
      issues: {
        where: { status: { in: ["OPEN", "REVIEWING"] } },
        select: { id: true },
      },
    },
  });
  if (!order) {
    return { ok: false, status: 404, error: "Artwork order not found" };
  }
  if (order.artwork.creatorProfileId !== ctx.creatorProfileId) {
    return { ok: false, status: 403, error: "Forbidden: not the artwork owner" };
  }
  if (order.issues.length === 0) {
    return { ok: false, status: 409, error: "No open artwork issue" };
  }
  if (["CANCELLED", "REFUNDED"].includes(order.status)) {
    return { ok: false, status: 400, error: "Artwork order issue cannot be resolved" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const issueUpdate = await tx.artworkOrderIssue.updateMany({
        where: { orderId, status: { in: ["OPEN", "REVIEWING"] } },
        data: { status: "RESOLVED" },
      });
      const updatedOrder = await tx.artworkOrder.update({
        where: { id: orderId },
        data: { status: "RECEIVED", receivedAt: now },
      });

      let settlementStatus: string | undefined;
      if (order.payment?.settlement) {
        const settlement = await tx.settlement.update({
          where: { id: order.payment.settlement.id },
          data: {
            status: "AVAILABLE",
            availableAt: order.payment.settlement.availableAt ?? now,
            heldReason: null,
          },
        });
        settlementStatus = settlement.status;
      }

      await tx.notification.create({
        data: {
          userId: order.fanUserId,
          type: "ARTWORK_ORDER_ISSUE_RESOLVED",
          message: buildNotificationMessage("ARTWORK_ORDER_ISSUE_RESOLVED", {}),
          linkUrl: notificationHref("ARTWORK_ORDER_ISSUE_RESOLVED", { artworkOrderId: orderId }),
        },
      });

      return {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        resolvedIssueCount: issueUpdate.count,
        settlementStatus,
      };
    });
    return { ok: true, data: result };
  } catch {
    return { ok: false, status: 500, error: "Artwork issue resolution failed" };
  }
}

export async function reportArtworkOrderIssue(
  ctx: ArtworkFulfillmentContext,
  orderId: string,
  input: ReportArtworkIssueInput,
): Promise<ArtworkFulfillmentResult<{ issueId: string; orderStatus: string }>> {
  const order = await prisma.artworkOrder.findUnique({
    where: { id: orderId },
    include: {
      artwork: { include: { creatorProfile: { select: { userId: true } } } },
      payment: { include: { settlement: true } },
    },
  });
  if (!order) {
    return { ok: false, status: 404, error: "Artwork order not found" };
  }
  if (order.fanUserId !== ctx.userId) {
    return { ok: false, status: 403, error: "Forbidden: only the buyer can report an issue" };
  }
  if (["CANCELLED", "REFUNDED"].includes(order.status)) {
    return { ok: false, status: 400, error: "Artwork order cannot receive issues" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const issue = await tx.artworkOrderIssue.create({
        data: {
          orderId,
          userId: ctx.userId,
          type: input.type,
          message: input.message,
          imageUrl: input.imageUrl,
        },
      });
      const updatedOrder = await tx.artworkOrder.update({
        where: { id: orderId },
        data: { status: "ISSUE_OPENED" },
      });
      if (order.payment?.settlement) {
        await tx.settlement.update({
          where: { id: order.payment.settlement.id },
          data: {
            status: "ON_HOLD",
            heldReason: `Artwork issue: ${input.type}`,
          },
        });
      }
      await tx.notification.create({
        data: {
          userId: order.artwork.creatorProfile.userId,
          type: "ARTWORK_ORDER_ISSUE_OPENED",
          message: buildNotificationMessage("ARTWORK_ORDER_ISSUE_OPENED", {}),
          linkUrl: notificationHref("ARTWORK_ORDER_ISSUE_OPENED", {
            artworkOrderId: orderId,
          }),
        },
      });
      return { issueId: issue.id, orderStatus: updatedOrder.status };
    });
    return { ok: true, data: result };
  } catch {
    return { ok: false, status: 500, error: "Artwork issue report failed" };
  }
}
