import { prisma } from "@/lib/prisma";
import {
  payoutSettingsSchema,
} from "@/lib/validation/payout";

export type PayoutSettingsContext = {
  creatorProfileId: string;
};

export type SavePayoutSettingsResult =
  | { ok: true; accountId: string }
  | { ok: false; error: string };

export function maskAccountNumber(accountNumber: string) {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `${"*".repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
}

export async function saveCreatorPayoutSettings(
  ctx: PayoutSettingsContext,
  input: unknown,
): Promise<SavePayoutSettingsResult> {
  const parsed = payoutSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "정산 계좌 정보를 다시 확인해주세요." };
  }

  const { accountNumber, ...data } = parsed.data;
  if (accountNumber.length < 8 || accountNumber.length > 20) {
    return { ok: false, error: "계좌번호는 숫자 8~20자리로 입력해주세요." };
  }

  try {
    const account = await prisma.creatorPayoutAccount.upsert({
      where: { creatorProfileId: ctx.creatorProfileId },
      create: {
        creatorProfileId: ctx.creatorProfileId,
        ...data,
        accountNumberMasked: maskAccountNumber(accountNumber),
        accountNumberLast4: accountNumber.slice(-4),
        verificationStatus: "PENDING_VERIFICATION",
        submittedAt: new Date(),
      },
      update: {
        ...data,
        accountNumberMasked: maskAccountNumber(accountNumber),
        accountNumberLast4: accountNumber.slice(-4),
        verificationStatus: "PENDING_VERIFICATION",
        submittedAt: new Date(),
        verifiedAt: null,
      },
      select: { id: true },
    });

    return { ok: true, accountId: account.id };
  } catch (error) {
    console.error("Failed to save creator payout settings:", error);
    return { ok: false, error: "정산 설정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요." };
  }
}
