export const NOTIFICATION_CATEGORY_FILTERS = [
  { id: "all", label: "전체" },
  { id: "membership", label: "멤버십" },
  { id: "program", label: "프로그램" },
  { id: "artwork", label: "작품" },
  { id: "settlement", label: "정산" },
] as const;

export type NotificationCategoryId = (typeof NOTIFICATION_CATEGORY_FILTERS)[number]["id"];

export function notificationCategory(type: string): Exclude<NotificationCategoryId, "all"> | "general" {
  if (type.startsWith("MEMBERSHIP_")) return "membership";
  if (type.startsWith("ARTWORK_")) return "artwork";
  if (type.startsWith("SETTLEMENT_")) return "settlement";
  if (
    type.startsWith("PROGRAM_") ||
    type.startsWith("APPLICATION_") ||
    type === "DELIVERY_REQUESTED" ||
    type === "COMPLETION_APPROVED" ||
    type === "MUTUAL_REVIEW_REQUESTED" ||
    type === "REVIEW_REQUESTED" ||
    type === "PROGRAM_CLOSED"
  ) {
    return "program";
  }
  return "general";
}

export function notificationCategoryLabel(type: string) {
  const category = notificationCategory(type);
  const filter = NOTIFICATION_CATEGORY_FILTERS.find((item) => item.id === category);
  return filter?.label ?? "일반";
}
