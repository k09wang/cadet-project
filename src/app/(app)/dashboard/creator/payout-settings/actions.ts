"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { saveCreatorPayoutSettings } from "@/lib/payout-settings";

export async function savePayoutSettingsAction(formData: FormData) {
  const user = await requireRole("CREATOR");
  if (!user.creatorProfile) {
    redirect("/dashboard/creator");
  }

  const result = await saveCreatorPayoutSettings(
    { creatorProfileId: user.creatorProfile.id },
    {
      businessType: String(formData.get("businessType") ?? "PERSONAL"),
      bankName: String(formData.get("bankName") ?? ""),
      accountHolder: String(formData.get("accountHolder") ?? ""),
      accountNumber: String(formData.get("accountNumber") ?? ""),
      businessRegistrationNo: String(formData.get("businessRegistrationNo") ?? ""),
    },
  );

  if (!result.ok) {
    redirect(`/dashboard/creator/payout-settings?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/dashboard/creator/payout-settings");
  revalidatePath("/dashboard/creator/settlements");
  redirect("/dashboard/creator/payout-settings?saved=1");
}
