import Link from "next/link";
import { Crown } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listMembershipPlansByCreator } from "@/lib/queries/memberships";

/**
 * 크리에이터 멤버십 플랜 관리 목록 페이지 (SPEC-014 REQ-1-001, REQ-1-002, REQ-1-003).
 * 비크리에이터 접근 시 리다이렉트. CreatorProfile 미보유 시 안내 문구.
 */
export default async function MembershipsManagePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CREATOR") {
    redirect("/login");
  }

  const profile = user.creatorProfile;

  if (!profile) {
    return (
      <main className="max-w-2xl mx-auto p-6 space-y-4">
        <h1 className="text-xl font-bold">멤버십 관리</h1>
        <p className="text-sm text-muted-foreground">
          크리에이터 프로필이 없습니다. 대시보드에서 스튜디오를 먼저 설정해 주세요.
        </p>
        <Link href="/dashboard/creator" className="text-sm text-primary underline">
          대시보드로 돌아가기
        </Link>
      </main>
    );
  }

  const plans = await listMembershipPlansByCreator(profile.id);

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-text-default">
            멤버십 관리
          </h1>
          <p className="text-sm text-text-muted">플랜과 멤버를 관리하세요</p>
        </div>
        <Link
          href="/dashboard/creator/memberships/new"
          className={buttonVariants({ variant: "default" })}
        >
          플랜 생성
        </Link>
      </header>

      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 멤버십 플랜이 없습니다. 플랜을 생성해 보세요.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-default bg-white shadow-card"
            >
              <div className="flex h-28 items-center justify-center bg-[linear-gradient(135deg,#ede9fe_0%,#ddd6fe_100%)] text-violet-500">
                <Crown className="size-8" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <Badge variant="membership" className="w-fit">
                  MEMBERSHIP
                </Badge>
                <h3 className="font-heading text-lg font-bold leading-tight text-text-default">
                  {plan.title}
                </h3>
                <p className="text-sm text-text-muted">
                  월 {plan.priceKrw.toLocaleString("ko-KR")}원
                </p>
                {plan.description ? (
                  <p className="line-clamp-2 text-sm text-text-muted">{plan.description}</p>
                ) : null}
                <div className="mt-auto flex items-center justify-end gap-3 border-t border-border-default pt-3">
                  <Link
                    href={`/dashboard/creator/memberships/${plan.id}/edit`}
                    className="text-sm font-semibold text-text-default transition-colors hover:text-brand-primary"
                  >
                    수정
                  </Link>
                  <DeletePlanButton planId={plan.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

/** 삭제 버튼 — 서버 액션으로 DELETE API 호출 후 페이지 재로드 */
function DeletePlanButton({ planId }: { planId: string }) {
  async function handleDelete() {
    "use server";
    const { getCurrentUser: getUser } = await import("@/lib/auth");
    const { redirect: r } = await import("next/navigation");
    const user = await getUser();
    if (!user || user.role !== "CREATOR") r("/login");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/membership-plans/${planId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      // 409: 활성 멤버 보유 — UI에 안내를 띄우기 위해 에러를 throw
      if (res.status === 409) {
        throw new Error(body.error ?? "활성 멤버가 있는 플랜은 삭제할 수 없습니다.");
      }
    }
    r("/dashboard/creator/memberships");
  }

  return (
    <form action={handleDelete}>
      <button
        type="submit"
        className="text-sm text-destructive hover:underline"
      >
        삭제
      </button>
    </form>
  );
}
