"use client";

import {
  ApplicationForm,
  type ApplicationFormProps,
} from "@/components/programs/ApplicationForm";

/**
 * Backward-compatible wrapper for the ArtBridge ApplicationForm.
 */
export function ApplyButton(props: ApplicationFormProps) {
  return <ApplicationForm {...props} />;
}
