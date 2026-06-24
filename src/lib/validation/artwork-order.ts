import { z } from "zod";

export const shipArtworkOrderSchema = z.object({
  carrier: z.string().min(1).max(80),
  trackingNo: z.string().min(1).max(120),
  shippedAt: z.coerce.date().optional(),
});

export const reportArtworkIssueSchema = z.object({
  type: z.enum([
    "NOT_DELIVERED",
    "DAMAGED",
    "WRONG_ITEM",
    "NOT_AS_DESCRIBED",
    "REFUND_REQUEST",
    "OTHER",
  ]),
  message: z.string().min(1).max(2000),
  imageUrl: z.string().url().max(500).optional(),
});

export const refundArtworkOrderSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const resolveArtworkIssueSchema = z.object({
  resolutionNote: z.string().trim().max(1000).optional(),
});

export type ShipArtworkOrderInput = z.infer<typeof shipArtworkOrderSchema>;
export type ReportArtworkIssueInput = z.infer<typeof reportArtworkIssueSchema>;
export type RefundArtworkOrderInput = z.infer<typeof refundArtworkOrderSchema>;
export type ResolveArtworkIssueInput = z.infer<typeof resolveArtworkIssueSchema>;
