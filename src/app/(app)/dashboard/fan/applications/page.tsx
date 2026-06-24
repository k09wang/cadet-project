import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listMyApplications } from "@/lib/queries/applications";
import {
  MyApplicationItem,
  type MyApplicationItemData,
} from "@/components/applications/MyApplicationItem";
import { buttonVariants } from "@/components/ui/button";

/**
 * 팬 '내 신청 현황' 페이지 (/dashboard/fan/applications).
 * 팬 본인의 전체 프로그램 신청을 상태 요약과 함께 한 화면에서 확인한다.
 * 미인증 시 /login 으로 보낸다.
 */
export default async function FanApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const applications = await listMyApplications(user.id);

  const pending = applications.filter((a) => a.status === "PENDING").length;
  const accepted = applications.filter((a) => a.status === "ACCEPTED").length;
  const rejected = applications.filter(
    (a) => a.status === "REJECTED" || a.status === "AUTO_REJECTED",
  ).length;

  return (
    <main className="mx-auto max-w-2xl space-y-6 py-6">
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
          <p className="text-xs text-muted-foreground">
            전체 {applications.length}건 · 대기 {pending} · 수락 {accepted} · 거절 {rejected}
          </p>
          <ul className="space-y-3">
            {applications.map((app) => (
              <MyApplicationItem
                key={app.id}
                application={app as MyApplicationItemData}
              />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
