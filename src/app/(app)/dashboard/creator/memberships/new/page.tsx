import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NewMembershipClient } from "@/components/dashboard/NewMembershipClient";

/**
 * 크리에이터 멤버십 플랜 생성 페이지 (SPEC-003 FR-001, SPEC-014 REQ-2-003, REQ-2-004).
 * AI 추천 패널이 포함된 NewMembershipClient를 사용한다.
 * 제출은 기존 createPlanAction(→ POST /api/membership-plans)으로 유지 (REQ-2-004).
 */
async function createPlanAction(formData: FormData): Promise<void> {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "CREATOR" || !user.creatorProfile) {
    redirect("/login");
  }

  const body: Record<string, unknown> = {
    title: formData.get("title"),
    priceKrw: Number(formData.get("priceKrw")),
  };
  const description = formData.get("description");
  if (description) body.description = description;

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/membership-plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    redirect("/dashboard/creator/memberships");
  }
}

export default async function NewMembershipPlanPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CREATOR") {
    redirect("/login");
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">멤버십 플랜 생성</h1>
      <NewMembershipClient action={createPlanAction} />
    </main>
  );
}
