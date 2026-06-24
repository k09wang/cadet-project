import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    creatorPayoutAccount: {
      upsert: vi.fn(),
    },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  maskAccountNumber,
  saveCreatorPayoutSettings,
} from "@/lib/payout-settings";

beforeEach(() => {
  mockPrisma.creatorPayoutAccount.upsert.mockReset();
});

describe("payout-settings", () => {
  it("maskAccountNumber는 마지막 4자리만 노출한다", () => {
    expect(maskAccountNumber("110-123-456789")).toBe("********6789");
  });

  it("saveCreatorPayoutSettings는 계좌번호를 마스킹해 upsert한다", async () => {
    mockPrisma.creatorPayoutAccount.upsert.mockResolvedValue({ id: "payout-1" });

    const result = await saveCreatorPayoutSettings(
      { creatorProfileId: "cp-1" },
      {
        businessType: "SOLE_PROPRIETOR",
        bankName: "신한은행",
        accountHolder: "김작가",
        accountNumber: "110-123-456789",
        businessRegistrationNo: "123-45-67890",
      },
    );

    expect(result).toEqual({ ok: true, accountId: "payout-1" });
    const arg = mockPrisma.creatorPayoutAccount.upsert.mock.calls[0][0];
    expect(arg.where).toEqual({ creatorProfileId: "cp-1" });
    expect(arg.create).toEqual(
      expect.objectContaining({
        creatorProfileId: "cp-1",
        businessType: "SOLE_PROPRIETOR",
        bankName: "신한은행",
        accountHolder: "김작가",
        accountNumberMasked: "********6789",
        accountNumberLast4: "6789",
        businessRegistrationNo: "1234567890",
        verificationStatus: "PENDING_VERIFICATION",
      }),
    );
    expect(arg.update).toEqual(
      expect.objectContaining({
        accountNumberMasked: "********6789",
        accountNumberLast4: "6789",
        verificationStatus: "PENDING_VERIFICATION",
        verifiedAt: null,
      }),
    );
  });

  it("saveCreatorPayoutSettings는 잘못된 계좌번호를 거부한다", async () => {
    const result = await saveCreatorPayoutSettings(
      { creatorProfileId: "cp-1" },
      {
        businessType: "PERSONAL",
        bankName: "신한은행",
        accountHolder: "김작가",
        accountNumber: "abc",
      },
    );

    expect(result.ok).toBe(false);
    expect(mockPrisma.creatorPayoutAccount.upsert).not.toHaveBeenCalled();
  });

  it("saveCreatorPayoutSettings는 저장 실패를 사용자 메시지로 반환한다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.creatorPayoutAccount.upsert.mockRejectedValue(new Error("missing table"));

    const result = await saveCreatorPayoutSettings(
      { creatorProfileId: "cp-1" },
      {
        businessType: "PERSONAL",
        bankName: "신한은행",
        accountHolder: "김작가",
        accountNumber: "110123456789",
      },
    );

    expect(result).toEqual({
      ok: false,
      error: "정산 설정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
    });
    errorSpy.mockRestore();
  });
});
