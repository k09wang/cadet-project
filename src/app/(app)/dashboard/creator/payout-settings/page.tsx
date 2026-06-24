import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getCreatorPayoutAccount } from "@/lib/queries/payout";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { savePayoutSettingsAction } from "./actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  PERSONAL: "개인",
  SOLE_PROPRIETOR: "개인사업자",
  CORPORATION: "법인",
};

const VERIFICATION_LABELS: Record<string, string> = {
  PENDING_VERIFICATION: "검증 대기",
  VERIFIED: "검증 완료",
  NEEDS_REVIEW: "확인 필요",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CreatorPayoutSettingsPage({ searchParams }: PageProps) {
  const user = await requireRole("CREATOR");
  if (!user.creatorProfile) {
    redirect("/dashboard/creator");
  }

  const [account, params] = await Promise.all([
    getCreatorPayoutAccount(user.creatorProfile.id),
    searchParams,
  ]);
  const saved = firstParam(params?.saved) === "1";
  const error = firstParam(params?.error);

  return (
    <main className="mx-auto max-w-3xl space-y-6 py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-text-default">
            정산 설정
          </h1>
          <p className="text-sm text-text-muted">
            정산 받을 계좌와 지급 정보를 등록하세요.
          </p>
        </div>
        <Link
          href="/dashboard/creator/settlements"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          정산 목록
        </Link>
      </header>

      {saved ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          정산 설정을 저장했습니다. 검증 대기 상태로 전환됩니다.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-[1fr_1.25fr]">
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-text-default">
              현재 상태
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              정산 가능 금액이 있어도 계좌 검증 전에는 지급이 보류될 수 있습니다.
            </p>
          </div>

          {account ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text-muted">검증 상태</dt>
                <dd className="font-medium text-text-default">
                  {VERIFICATION_LABELS[account.verificationStatus] ?? account.verificationStatus}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">유형</dt>
                <dd className="font-medium text-text-default">
                  {BUSINESS_TYPE_LABELS[account.businessType] ?? account.businessType}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">은행/예금주</dt>
                <dd className="font-medium text-text-default">
                  {account.bankName} · {account.accountHolder}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">계좌</dt>
                <dd className="font-medium text-text-default">
                  {account.accountNumberMasked}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="rounded-lg bg-neutral-50 px-4 py-5 text-sm text-text-muted">
              등록된 정산 계좌가 없습니다. 첫 정산 전 계좌 정보를 등록하세요.
            </div>
          )}
        </Card>

        <Card className="p-5">
          <form action={savePayoutSettingsAction} className="space-y-4">
            <div>
              <label
                htmlFor="businessType"
                className="text-sm font-medium text-text-default"
              >
                지급 유형
              </label>
              <select
                id="businessType"
                name="businessType"
                defaultValue={account?.businessType ?? "PERSONAL"}
                className="mt-1 w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm"
              >
                <option value="PERSONAL">개인</option>
                <option value="SOLE_PROPRIETOR">개인사업자</option>
                <option value="CORPORATION">법인</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="bankName"
                  className="text-sm font-medium text-text-default"
                >
                  은행명
                </label>
                <input
                  id="bankName"
                  name="bankName"
                  required
                  maxLength={50}
                  defaultValue={account?.bankName ?? ""}
                  className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm"
                  placeholder="예: 신한은행"
                />
              </div>
              <div>
                <label
                  htmlFor="accountHolder"
                  className="text-sm font-medium text-text-default"
                >
                  예금주
                </label>
                <input
                  id="accountHolder"
                  name="accountHolder"
                  required
                  maxLength={50}
                  defaultValue={account?.accountHolder ?? ""}
                  className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm"
                  placeholder="예: 김한진"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="accountNumber"
                className="text-sm font-medium text-text-default"
              >
                계좌번호
              </label>
              <input
                id="accountNumber"
                name="accountNumber"
                required
                inputMode="numeric"
                autoComplete="off"
                className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm"
                placeholder={account ? `${account.accountNumberMasked} 재입력` : "숫자만 입력"}
              />
              <p className="mt-1 text-xs text-text-muted">
                MVP에서는 전체 계좌번호를 저장하지 않고 마스킹 값과 마지막 4자리만 보관합니다.
              </p>
            </div>

            <div>
              <label
                htmlFor="businessRegistrationNo"
                className="text-sm font-medium text-text-default"
              >
                사업자등록번호
              </label>
              <input
                id="businessRegistrationNo"
                name="businessRegistrationNo"
                maxLength={20}
                defaultValue={account?.businessRegistrationNo ?? ""}
                className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm"
                placeholder="개인은 비워둘 수 있습니다"
              />
            </div>

            <button type="submit" className={buttonVariants({ className: "w-full" })}>
              정산 설정 저장
            </button>
          </form>
        </Card>
      </section>
    </main>
  );
}
