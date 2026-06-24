import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PostCreateForm } from "@/components/dashboard/PostCreateForm";

/**
 * 크리에이터 포스트 생성 페이지 (SPEC-003 FR-012).
 * 비크리에이터 접근 시 리다이렉트.
 */
async function createPostAction(formData: FormData): Promise<void> {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "CREATOR" || !user.creatorProfile) {
    redirect("/login");
  }

  // intent=draft → 임시저장(DRAFT), 그 외 → 발행(PUBLISHED).
  const status = formData.get("intent") === "draft" ? "DRAFT" : "PUBLISHED";
  const body: Record<string, unknown> = {
    title: formData.get("title"),
    body: formData.get("body"),
    visibility: formData.get("visibility"),
    status,
  };
  const priceKrw = formData.get("priceKrw");
  if (priceKrw) body.priceKrw = Number(priceKrw);

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    // 작성된 포스트 상세로 이동하며 완료 토스트 노출.
    const created = (await res.json()) as { id: string };
    const kind = status === "DRAFT" ? "draft" : "published";
    redirect(`/posts/${created.id}?created=${kind}`);
  }
}

export default async function NewPostPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CREATOR") {
    redirect("/login");
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">새 포스트 작성</h1>
      <PostCreateForm action={createPostAction} />
    </main>
  );
}
