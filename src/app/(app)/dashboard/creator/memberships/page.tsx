import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">멤버십 관리</h1>
        <Link
          href="/dashboard/creator/memberships/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          플랜 생성
        </Link>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 멤버십 플랜이 없습니다. 플랜을 생성해 보세요.
        </p>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => (
            <li key={plan.id} className="rounded-xl border p-4 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{plan.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {plan.priceKrw.toLocaleString("ko-KR")}원 / 월
                  </p>
                  {plan.description ? (
                    <p className="text-sm mt-1 text-muted-foreground line-clamp-2">
                      {plan.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/dashboard/creator/memberships/${plan.id}/edit`}
                    className="text-sm text-primary hover:underline"
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
