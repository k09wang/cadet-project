import { z } from "zod";

export const payoutBusinessTypes = [
  "PERSONAL",
  "SOLE_PROPRIETOR",
  "CORPORATION",
] as const;

export const payoutSettingsSchema = z.object({
  businessType: z.enum(payoutBusinessTypes).default("PERSONAL"),
  bankName: z.string().trim().min(1).max(50),
  accountHolder: z.string().trim().min(1).max(50),
  accountNumber: z
    .string()
    .trim()
    .min(8)
    .max(30)
    .regex(/^[0-9-\s]+$/),
  businessRegistrationNo: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("").transform(() => undefined)),
}).transform((data) => ({
  ...data,
  accountNumber: data.accountNumber.replace(/\D/g, ""),
  businessRegistrationNo: data.businessRegistrationNo?.replace(/\D/g, ""),
}));

export type PayoutSettingsInput = z.input<typeof payoutSettingsSchema>;
