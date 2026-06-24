import { prisma } from "@/lib/prisma";

export function getArtworkOrderForFan(orderId: string, fanUserId: string) {
  return prisma.artworkOrder.findFirst({
    where: { id: orderId, fanUserId },
    include: {
      artwork: {
        include: {
          creatorProfile: { select: { id: true, studioName: true } },
        },
      },
      payment: true,
      shipment: true,
      issues: { orderBy: { createdAt: "desc" } },
    },
  });
}

export function listFanArtworkOrders(fanUserId: string) {
  return prisma.artworkOrder.findMany({
    where: { fanUserId },
    orderBy: { createdAt: "desc" },
    include: {
      artwork: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          creatorProfile: { select: { id: true, studioName: true } },
        },
      },
      payment: true,
      shipment: true,
      issues: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, type: true },
      },
    },
  });
}

export function getArtworkForCheckout(artworkId: string) {
  return prisma.artwork.findFirst({
    where: {
      id: artworkId,
      status: "PUBLISHED",
      stock: { gt: 0 },
    },
    include: {
      creatorProfile: { select: { id: true, studioName: true } },
    },
  });
}

export function listCreatorArtworkOrders(creatorProfileId: string) {
  return prisma.artworkOrder.findMany({
    where: {
      artwork: { creatorProfileId },
    },
    orderBy: { createdAt: "desc" },
    include: {
      fan: { select: { id: true, name: true } },
      artwork: { select: { id: true, title: true, imageUrl: true } },
      payment: { include: { settlement: true } },
      shipment: true,
      issues: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, type: true },
      },
    },
  });
}

export function listCreatorWorks(creatorProfileId: string) {
  return prisma.creatorWork.findMany({
    where: { creatorProfileId },
    orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
  });
}

export function listCreatorArtworks(creatorProfileId: string) {
  return prisma.artwork.findMany({
    where: { creatorProfileId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });
}
