"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { joinMembership } from "@/app/(app)/creators/[creatorId]/actions";

export async function joinMembershipCheckoutAction(planId: string) {
  await joinMembership(planId);
  revalidatePath("/dashboard/fan/memberships");
  revalidatePath("/dashboard/fan/payments");
  redirect("/dashboard/fan/memberships");
}
