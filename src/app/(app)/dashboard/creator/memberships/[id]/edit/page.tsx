import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { membershipPlanUpdateSchema } from "@/lib/validation/membership";
import { MembershipPlanForm } from "@/components/dashboard/MembershipPlanForm";

/**
 * 크리에이터 멤버십 플랜 수정 페이지 (SPEC-014 REQ-1-004, REQ-1-005, REQ-1-006, AC-1-004).
 * 본인 플랜이 아니면 404. 수정 액션은 PATCH API를 호출한다.
 */
export default async function EditMembershipPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "CREATOR" || !user.creatorProfile) {
    redirect("/login");
  }

  const plan = await prisma.membershipPlan.findUnique({ where: { id } });
  if (!plan || plan.creatorProfileId !== user.creatorProfile.id) {
    notFound();
  }

  async function updatePlanAction(formData: FormData): Promise<void> {
    "use server";
    const current = await getCurrentUser();
    if (!current || current.role !== "CREATOR") redirect("/login");

    const body: Record<string, unknown> = {};
    const title = formData.get("title");
    const priceKrw = formData.get("priceKrw");
    const description = formData.get("description");
    if (title) body.title = title;
    if (priceKrw) body.priceKrw = Number(priceKrw);
    if (description) body.description = description;

    const parsed = membershipPlanUpdateSchema.safeParse(body);
    if (!parsed.success) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/membership-plans/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      },
    );
    if (res.ok) {
      redirect("/dashboard/creator/memberships");
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">멤버십 플랜 수정</h1>
      <MembershipPlanForm
        action={updatePlanAction}
        initial={{
          title: plan.title,
          priceKrw: plan.priceKrw,
          description: plan.description ?? undefined,
        }}
      />
    </main>
  );
}
