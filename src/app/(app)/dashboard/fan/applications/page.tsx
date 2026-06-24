import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listMyApplications } from "@/lib/queries/applications";
import {
  MyApplicationItem,
  type MyApplicationItemData,
} from "@/components/applications/MyApplicationItem";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * 팬 '내 신청 현황' 페이지 (/dashboard/fan/applications).
 * 팬 본인의 전체 프로그램 신청을 상태 요약과 함께 한 화면에서 확인한다.
 * 미인증 시 /login 으로 보낸다.
 */
type ApplicationStatusFilter =
  | "all"
  | "pending"
  | "payment"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "rejected";

const STATUS_FILTERS: { value: ApplicationStatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "신청됨" },
  { value: "payment", label: "결제 대기" },
  { value: "confirmed", label: "참여 확정" },
  { value: "in-progress", label: "진행" },
  { value: "completed", label: "완료" },
  { value: "rejected", label: "거절" },
];

function resolveFilter(app: MyApplicationItemData): Exclude<ApplicationStatusFilter, "all"> {
  if (app.status === "REJECTED" || app.status === "AUTO_REJECTED") return "rejected";
  if (app.completionApprovedAt) return "completed";
  if (app.deliveryRequestedAt) return "in-progress";
  if (app.status === "PENDING_PAYMENT" || app.status === "RESERVED" || app.payment?.status === "PENDING") {
    return "payment";
  }
  if (app.status === "ACCEPTED" || app.payment?.status === "PAID" || app.payment?.status === "RELEASED") {
    return "confirmed";
  }
  return "pending";
}

function isApplicationStatusFilter(value: string | undefined): value is ApplicationStatusFilter {
  return STATUS_FILTERS.some((filter) => filter.value === value);
}

export default async function FanApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { status } = await (searchParams ?? Promise.resolve<{ status?: string }>({}));
  const activeFilter = isApplicationStatusFilter(status) ? status : "all";
  const applications = await listMyApplications(user.id);
  const visibleApplications =
    activeFilter === "all"
      ? applications
      : applications.filter((app) => resolveFilter(app as MyApplicationItemData) === activeFilter);

  return (
    <main className="mx-auto max-w-[760px] space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">내 신청 현황</h1>
        <p className="text-sm text-muted-foreground">
          참여 신청한 프로그램의 진행 상태를 확인하세요.
        </p>
      </header>

      {applications.length === 0 ? (
        <div className="space-y-4 rounded-xl ring-1 ring-foreground/10 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">아직 신청한 프로그램이 없습니다.</p>
          <Link href="/programs" className={buttonVariants({ variant: "default" })}>
            프로그램 탐색하기
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" aria-label="신청 상태 필터">
            {STATUS_FILTERS.map((filter) => {
              const active = activeFilter === filter.value;
              const href =
                filter.value === "all"
                  ? "/dashboard/fan/applications"
                  : `/dashboard/fan/applications?status=${filter.value}`;

              return (
                <Link
                  key={filter.value}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-[30px] items-center justify-center rounded-full px-3.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-brand-primary text-white"
                      : "border border-border-default bg-neutral-50 text-text-default hover:border-brand-primary hover:text-brand-primary",
                  )}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
          <ul className="space-y-3">
            {visibleApplications.map((app) => (
              <MyApplicationItem
                key={app.id}
                application={app as MyApplicationItemData}
              />
            ))}
          </ul>
          {visibleApplications.length === 0 ? (
            <div className="rounded-[12px] border border-border-default bg-white px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">해당 상태의 신청이 없습니다.</p>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
