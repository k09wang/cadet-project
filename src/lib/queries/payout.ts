import { prisma } from "@/lib/prisma";

export async function getCreatorPayoutAccount(creatorProfileId: string) {
  try {
    return await prisma.creatorPayoutAccount.findUnique({
      where: { creatorProfileId },
    });
  } catch (error) {
    console.error("Failed to load creator payout account:", error);
    return null;
  }
}
