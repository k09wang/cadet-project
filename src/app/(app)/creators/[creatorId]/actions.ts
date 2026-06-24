"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toggleBookmark } from "@/lib/bookmarks";
import { mockPaymentProvider } from "@/lib/payment/provider";
import { buildNotificationMessage, notificationHref } from "@/lib/notification-types";
import { purchaseArtwork } from "@/lib/artwork-orders";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Membership } from "@prisma/client";

/**
 * 팬이 멤버십 플랜에 가입하는 서버 액션 (SPEC-003 FR-004, FR-005, FR-006, AC-002, AC-003, NFR-003).
 * - Membership 레코드를 생성한다.
 * - Prisma P2002(Unique constraint) 에러를 잡아 기존 멤버십을 반환 (멱등 처리).
 * - 그 외 에러는 재던진다.
 */
export async function joinMembership(planId: string): Promise<Membership> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: 로그인이 필요합니다.");
  }

  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId },
    select: { priceKrw: true, creatorProfileId: true },
  });
  if (!plan) {
    throw new Error("플랜을 찾을 수 없습니다.");
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);
  const charge = await mockPaymentProvider.charge({ amount: plan.priceKrw });
  const feeKrw = Math.round(plan.priceKrw * 0.1);

  if (!charge.success) {
    await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.upsert({
        where: { userId_planId: { userId: user.id, planId } },
        update: {
          status: "PAYMENT_FAILED",
          cancelledAt: null,
        },
        create: {
          userId: user.id,
          planId,
          status: "PAYMENT_FAILED",
          startedAt: now,
        },
      });
      const payment = await tx.payment.create({
        data: {
          membershipId: membership.id,
          fanUserId: user.id,
          amount: plan.priceKrw,
          feeKrw,
          status: "FAILED",
          provider: mockPaymentProvider.name,
          providerTxId: charge.providerTxId,
        },
      });
      await tx.membership.update({
        where: { id: membership.id },
        data: { lastPaymentId: payment.id },
      });
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "MEMBERSHIP_PAYMENT_FAILED",
          message: buildNotificationMessage("MEMBERSHIP_PAYMENT_FAILED", {}),
          linkUrl: notificationHref("MEMBERSHIP_PAYMENT_FAILED", {
            membershipId: membership.id,
          }),
        },
      });
    });
    throw new Error("Membership payment failed");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.upsert({
        where: { userId_planId: { userId: user.id, planId } },
        update: {
          status: "ACTIVE",
          startedAt: now,
          expiresAt,
          cancelledAt: null,
        },
        create: {
          userId: user.id,
          planId,
          status: "ACTIVE",
          startedAt: now,
          expiresAt,
        },
      });
      const payment = await tx.payment.create({
        data: {
          membershipId: membership.id,
          fanUserId: user.id,
          amount: plan.priceKrw,
          feeKrw,
          status: "PAID",
          provider: mockPaymentProvider.name,
          providerTxId: charge.providerTxId,
        },
      });
      const payout = plan.priceKrw - feeKrw;
      await tx.settlement.create({
        data: {
          paymentId: payment.id,
          sourceType: "MEMBERSHIP",
          sourceId: planId,
          grossAmount: plan.priceKrw,
          feeKrw,
          payout,
          status: "PENDING",
        },
      });
      const updatedMembership = await tx.membership.update({
        where: { id: membership.id },
        data: { lastPaymentId: payment.id },
      });
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "MEMBERSHIP_PAYMENT_PAID",
          message: buildNotificationMessage("MEMBERSHIP_PAYMENT_PAID", {}),
          linkUrl: notificationHref("MEMBERSHIP_PAYMENT_PAID", {
            membershipId: membership.id,
          }),
        },
      });
      return updatedMembership;
    });
  } catch (err) {
    // NFR-003: @@unique([userId, planId]) 중복 시 P2002 → 기존 레코드 반환
    if (isPrismaUniqueError(err)) {
      const existing = await prisma.membership.findFirst({
        where: { userId: user.id, planId },
      });
      if (existing) return existing;
    }
    throw err;
  }
}

function isPrismaUniqueError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

/**
 * 관심 작가 북마크 토글 Server Action (PRD §13.2).
 * 인증 필요(미인증 401). 성공 시 스튜디오 페이지를 revalidate한다.
 * 반환값의 bookmarked로 클라이언트 UI를 즉시 갱신할 수 있다.
 */
export async function toggleBookmarkAction(
  creatorProfileId: string,
): Promise<{ ok: true; bookmarked: boolean } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Unauthorized: 로그인이 필요합니다." };
  }

  const result = await toggleBookmark(user.id, creatorProfileId);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath(`/creators/${creatorProfileId}`);
  revalidatePath("/dashboard/fan/bookmarks");
  return { ok: true, bookmarked: result.data.bookmarked };
}

export async function purchaseArtworkAction(
  artworkId: string,
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: 로그인이 필요합니다.");
  }

  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const recipientPhone = String(formData.get("recipientPhone") ?? "").trim();
  const shippingAddress = String(formData.get("shippingAddress") ?? "").trim();
  const shippingMemo = String(formData.get("shippingMemo") ?? "").trim();
  if (!recipientName || !recipientPhone || !shippingAddress) {
    throw new Error("배송 정보를 입력해 주세요.");
  }

  const result = await purchaseArtwork(
    { userId: user.id },
    {
      artworkId,
      recipientName,
      recipientPhone,
      shippingAddress,
      shippingMemo: shippingMemo || undefined,
      shippingFeeKrw: 0,
    },
  );

  if (!result.ok) {
    throw new Error(result.error);
  }

  revalidatePath("/dashboard/fan/payments");
  redirect(`/artwork-orders/${result.data.orderId}`);
}
