import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgramDetail } from "@/lib/queries/programs";
import { getCurrentUser } from "@/lib/auth";
import { findActiveApplication } from "@/lib/queries/applications";
import { effectiveStatus } from "@/lib/program-status";
import { formatKrw, formatDate, formatProgramPeriod } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ProgramFaqSection } from "@/components/programs/ProgramFaqSection";
import { applyProgramCheckoutAction } from "./actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProgramCheckoutPage({ params, searchParams }: PageProps) {
  const [{ id }, paramsValue] = await Promise.all([
    params,
    searchParams,
  ]);
  const program = await getProgramDetail(id);
  if (!program) notFound();

  const user = await getCurrentUser();
  const activeApplication = user ? await findActiveApplication(id, user.id) : null;
  const status = effectiveStatus({
    status: program.status,
    recruitDeadline: program.recruitDeadline,
    startDate: program.startDate,
    endDate: program.endDate,
  });
  const owner = user?.creatorProfile?.id === program.creatorProfileId;
  const error = firstParam(paramsValue?.error);
  const feeKrw = Math.round(program.priceKrw * 0.1);

  return (
    <main className="mx-auto max-w-4xl space-y-6 py-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-text-muted">
          {program.creatorProfile?.studioName ?? "크리에이터"}
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-text-default">
          프로그램 신청/결제
        </h1>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <Card className="space-y-3 p-5">
            <h2 className="font-heading text-lg font-semibold text-text-default">
              신청 정보
            </h2>
            {activeApplication ? (
              <p className="rounded-lg bg-brand-subtle px-4 py-3 text-sm font-medium text-brand-primary">
                이미 신청한 프로그램입니다. 내 활동에서 상태를 확인하세요.
              </p>
            ) : owner ? (
              <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm text-text-muted">
                본인 프로그램에는 신청할 수 없습니다.
              </p>
            ) : status !== "RECRUITING" ? (
              <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm text-text-muted">
                현재 신청 가능한 상태가 아닙니다.
              </p>
            ) : (
              <form action={applyProgramCheckoutAction.bind(null, program.id)} className="space-y-4">
                <div>
                  <label htmlFor="message" className="text-sm font-medium text-text-default">
                    신청 메시지
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    maxLength={1000}
                    className="mt-1 w-full resize-none rounded-lg border border-border-default px-3 py-2 text-sm"
                    placeholder="크리에이터에게 남길 메시지가 있다면 간단히 남겨주세요."
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-text-default">
                  <input required type="checkbox" className="size-4 accent-brand-primary" />
                  일정, 정원, 취소/환불 기준을 확인했습니다.
                </label>
                <button type="submit" className={buttonVariants({ className: "w-full" })}>
                  {program.priceKrw > 0
                    ? `${program.priceKrw.toLocaleString("ko-KR")}원 결제하고 신청`
                    : "무료로 신청하기"}
                </button>
              </form>
            )}
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="font-heading text-lg font-semibold text-text-default">
              참여 전 안내
            </h2>
            <ul className="space-y-2 text-sm leading-6 text-text-muted">
              <li>선착순 프로그램은 정원 안에서 신청과 결제가 완료되면 바로 확정됩니다.</li>
              <li>팬은 신청 후 내 활동에서 취소할 수 있고, 크리에이터는 신청 멤버를 관리할 수 있습니다.</li>
              <li>유료 프로그램은 결제 완료 후 정산 예정 상태로 기록됩니다.</li>
            </ul>
          </Card>

          <ProgramFaqSection
            priceKrw={program.priceKrw}
            startDate={program.startDate}
            endDate={program.endDate}
            recruitDeadline={program.recruitDeadline}
            maxParticipants={program.maxParticipants}
          />
        </section>

        <aside className="space-y-4">
          <Card className="space-y-4 p-5">
            <div>
              <h2 className="font-heading text-lg font-semibold text-text-default">
                {program.title}
              </h2>
              {program.description ? (
                <p className="mt-2 line-clamp-4 text-sm leading-6 text-text-muted">
                  {program.description}
                </p>
              ) : null}
            </div>
            <dl className="space-y-2 border-t border-border-default pt-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">일정</dt>
                <dd className="text-right font-medium text-text-default">
                  {formatProgramPeriod(program.startDate, program.endDate) ?? "협의 예정"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">모집 마감</dt>
                <dd className="font-medium text-text-default">
                  {formatDate(program.recruitDeadline) ?? "상시 모집"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">정원</dt>
                <dd className="font-medium text-text-default">
                  {program.maxParticipants ? `${program.maxParticipants}명` : "제한 없음"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-text-muted">플랫폼 수수료</dt>
                <dd className="font-medium text-text-default">{formatKrw(feeKrw)}</dd>
              </div>
              <div className="flex justify-between gap-3 pt-2 text-base">
                <dt className="font-semibold text-text-default">총 결제금액</dt>
                <dd className="font-bold text-brand-primary">{formatKrw(program.priceKrw)}</dd>
              </div>
            </dl>
            <Link
              href={`/programs/${program.id}`}
              className={buttonVariants({ variant: "outline", className: "w-full" })}
            >
              상세로 돌아가기
            </Link>
          </Card>
        </aside>
      </div>
    </main>
  );
}
