import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url()
  .max(500)
  .optional()
  .or(z.literal("").transform(() => undefined));

const imageUrlValue = z.union([
  z.string().trim().url().max(500),
  z.string().trim().regex(/^\/uploads\/creator-assets\/[A-Za-z0-9._-]+$/).max(500),
]);

const optionalImageUrl = imageUrlValue
  .optional()
  .or(z.literal("").transform(() => undefined));

const clearableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();

const clearableUrl = z
  .string()
  .trim()
  .url()
  .max(500)
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

const clearableImageUrl = imageUrlValue
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

const clearableDate = z.preprocess(
  (value) => (value === "" ? null : value),
  z.union([z.null(), z.coerce.date()]).optional(),
);

export const creatorWorkCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  kind: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  imageUrl: optionalImageUrl,
  externalUrl: optionalUrl,
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional(),
}).refine(
  (data) => !data.startedAt || !data.endedAt || data.startedAt <= data.endedAt,
  { path: ["endedAt"], message: "endedAt must be after startedAt" },
);

export const creatorWorkUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  kind: clearableText(80),
  description: clearableText(2000),
  imageUrl: clearableImageUrl,
  externalUrl: clearableUrl,
  startedAt: clearableDate,
  endedAt: clearableDate,
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" },
).refine(
  (data) => !(data.startedAt instanceof Date) || !(data.endedAt instanceof Date) || data.startedAt <= data.endedAt,
  { path: ["endedAt"], message: "endedAt must be after startedAt" },
);

export const artworkCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  imageUrl: optionalImageUrl,
  priceKrw: z.coerce.number().int().positive(),
  stock: z.coerce.number().int().min(0).default(1),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]).default("DRAFT"),
});

export const artworkUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: clearableText(2000),
  imageUrl: clearableImageUrl,
  priceKrw: z.coerce.number().int().positive().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" },
);

export type CreatorWorkCreateInput = z.infer<typeof creatorWorkCreateSchema>;
export type CreatorWorkUpdateInput = z.infer<typeof creatorWorkUpdateSchema>;
export type ArtworkCreateInput = z.infer<typeof artworkCreateSchema>;
export type ArtworkUpdateInput = z.infer<typeof artworkUpdateSchema>;
