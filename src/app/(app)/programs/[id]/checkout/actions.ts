"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { applyToProgram } from "@/lib/applications";

export async function applyProgramCheckoutAction(programId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const message = String(formData.get("message") ?? "").trim();

  const result = await applyToProgram(
    { role: user.role, creatorProfileId: user.creatorProfile?.id },
    programId,
    user.id,
    message || undefined,
  );

  if (!result.ok) {
    redirect(`/programs/${programId}/checkout?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath(`/programs/${programId}`);
  revalidatePath("/dashboard/fan/applications");
  revalidatePath("/dashboard/fan/payments");
  redirect("/dashboard/fan/payments");
}
