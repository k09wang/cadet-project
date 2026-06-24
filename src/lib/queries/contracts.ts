import { prisma } from "@/lib/prisma";

/**
 * 계약/결제 조회(read) 쿼리 (SPEC-006 FR-011, FR-012, 7장 UI).
 */

/**
 * 계약 상세 — 프로그램 요약, 신청자(팬), 결제 내역 포함 (FR-011, FR-012).
 * 계약 페이지(`/contracts/[id]`) 렌더에 사용된다.
 */
export function getContractDetail(contractId: string) {
  return prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      application: {
        include: {
          user: { select: { id: true, name: true } },
          program: {
            include: {
              creatorProfile: { select: { id: true, studioName: true, userId: true } },
            },
          },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        include: { settlement: true },
      },
    },
  });
}

/**
 * 팬의 결제 내역 (7장 `/dashboard/fan/payments`).
 * 멤버십/포스트/계약/선착순 프로그램/작품 결제를 모두 최신순으로 조회한다.
 */
export function listFanPayments(fanUserId: string) {
  return prisma.payment.findMany({
    where: { fanUserId },
    orderBy: { createdAt: "desc" },
    include: {
      settlement: true,
      membership: {
        include: {
          plan: {
            include: {
              creatorProfile: { select: { id: true, studioName: true } },
            },
          },
        },
      },
      post: {
        include: {
          creatorProfile: { select: { id: true, studioName: true } },
        },
      },
      contract: {
        include: {
          application: {
            include: {
              program: { select: { id: true, title: true, creatorProfileId: true } },
            },
          },
        },
      },
      programApplication: {
        include: {
          program: { select: { id: true, title: true, creatorProfileId: true } },
        },
      },
      artworkOrder: {
        include: {
          artwork: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              creatorProfile: { select: { id: true, studioName: true } },
            },
          },
          shipment: true,
          issues: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, status: true, type: true },
          },
        },
      },
    },
  });
}

export function getFanPaymentReceipt(paymentId: string, fanUserId: string) {
  return prisma.payment.findFirst({
    where: { id: paymentId, fanUserId },
    include: {
      fan: { select: { id: true, name: true, email: true } },
      settlement: true,
      membership: {
        include: {
          plan: {
            include: {
              creatorProfile: { select: { id: true, studioName: true } },
            },
          },
        },
      },
      post: {
        include: {
          creatorProfile: { select: { id: true, studioName: true } },
        },
      },
      contract: {
        include: {
          application: {
            include: {
              program: {
                include: {
                  creatorProfile: { select: { id: true, studioName: true } },
                },
              },
            },
          },
        },
      },
      programApplication: {
        include: {
          program: {
            include: {
              creatorProfile: { select: { id: true, studioName: true } },
            },
          },
        },
      },
      artworkOrder: {
        include: {
          artwork: {
            include: {
              creatorProfile: { select: { id: true, studioName: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * 팬의 프로그램 참여 진행 대상 — 선착순 프로그램 결제/확정 진입점.
 */
export function listFanAcceptedApplications(fanUserId: string) {
  return prisma.programApplication.findMany({
    where: { userId: fanUserId, status: { in: ["RESERVED", "PENDING_PAYMENT", "ACCEPTED"] } },
    orderBy: { updatedAt: "desc" },
    include: {
      program: {
        select: {
          id: true,
          title: true,
          priceKrw: true,
          status: true,
          // 완료 후 리뷰 작성 여부 판별용(본인 작성 리뷰만).
          reviews: { where: { userId: fanUserId }, select: { id: true }, take: 1 },
        },
      },
      payment: { select: { id: true, status: true } },
    },
  });
}

/**
 * 크리에이터 정산 내역 — 멤버십/포스트/계약/선착순 프로그램/작품 결제를 모두 조회한다.
 * Settlement를 기준으로 조회해 sourceType, 보류/가능/완료 상태를 한 화면에서 표현한다.
 */
export function listCreatorSettlements(creatorProfileId: string) {
  return prisma.settlement.findMany({
    where: {
      payment: {
        OR: [
          {
            membership: {
              plan: { creatorProfileId },
            },
          },
          { post: { creatorProfileId } },
          {
            contract: {
              application: {
                program: { creatorProfileId },
              },
            },
          },
          {
            programApplication: {
              program: { creatorProfileId },
            },
          },
          {
            artworkOrder: {
              artwork: { creatorProfileId },
            },
          },
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      payment: {
        include: {
          fan: { select: { id: true, name: true } },
          membership: {
            include: {
              plan: { select: { id: true, title: true, creatorProfileId: true } },
            },
          },
          post: { select: { id: true, title: true, creatorProfileId: true } },
          contract: {
            include: {
              application: {
                include: {
                  program: { select: { id: true, title: true, creatorProfileId: true } },
                  user: { select: { id: true, name: true } },
                },
              },
            },
          },
          programApplication: {
            include: {
              program: { select: { id: true, title: true, creatorProfileId: true } },
              user: { select: { id: true, name: true } },
            },
          },
          artworkOrder: {
            include: {
              artwork: { select: { id: true, title: true, creatorProfileId: true } },
              fan: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
}
