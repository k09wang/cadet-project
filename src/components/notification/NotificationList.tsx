"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import {
  NOTIFICATION_CATEGORY_FILTERS,
  notificationCategory,
  notificationCategoryLabel,
  type NotificationCategoryId,
} from "@/lib/notification-categories";
import { Bell, Check, X, AlertCircle } from "lucide-react";

/**
 * 알림 타입별 아이콘 매핑 (SPEC-005 NFR-005).
 */
const iconMap: Record<string, React.ElementType> = {
  APPLICATION_CREATED: Bell,
  APPLICATION_ACCEPTED: Check,
  APPLICATION_REJECTED: X,
  APPLICATION_AUTO_REJECTED: X,
  PROGRAM_CLOSED: AlertCircle,
};

/**
 * 카테고리별 태그 색상 (Figma 28 알림 디자인 정합).
 * 색은 디자인 요소이며 라벨/카테고리 분류는 코드 기준 그대로 사용한다.
 */
const categoryTagClass: Record<string, string> = {
  membership: "bg-violet-50 text-violet-700",
  program: "bg-blue-50 text-blue-700",
  artwork: "bg-amber-50 text-amber-700",
  settlement: "bg-emerald-50 text-emerald-700",
  general: "bg-neutral-100 text-text-muted",
};

/**
 * 알림 목록 (SPEC-005 FR-014, AC-006).
 */
interface NotificationListProps {
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    linkUrl: string | null;
    readAt: Date | string | null;
    createdAt: Date | string;
  }>;
}

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeCategory, setActiveCategory] = useState<NotificationCategoryId>("all");

  const counts = useMemo(() => {
    const next: Record<NotificationCategoryId, number> = {
      all: notifications.length,
      membership: 0,
      program: 0,
      artwork: 0,
      settlement: 0,
    };

    notifications.forEach((notification) => {
      const category = notificationCategory(notification.type);
      if (category !== "general") next[category] += 1;
    });
    return next;
  }, [notifications]);

  const filteredNotifications = useMemo(
    () =>
      activeCategory === "all"
        ? notifications
        : notifications.filter((notification) => notificationCategory(notification.type) === activeCategory),
    [activeCategory, notifications],
  );

  const handleReadAll = () => {
    startTransition(async () => {
      try {
        await fetch("/api/notifications/read-all", { method: "PATCH" });
        router.refresh();
      } catch {
        // 실패 시 무음 (UX 간소화)
      }
    });
  };

  const handleNotificationClick = async (
    notificationId: string,
    linkUrl: string | null,
  ) => {
    startTransition(async () => {
      try {
        // 읽음 처리
        await fetch(`/api/notifications/${notificationId}/read`, {
          method: "PATCH",
        });

        // 링크가 있으면 이동, 없으면 알림 페이지 유지
        if (linkUrl) {
          router.push(linkUrl);
        } else {
          router.refresh();
        }
      } catch {
        // 실패 시 무음
      }
    });
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">알림이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">알림</h1>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleReadAll}
        >
          전체 읽음
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="알림 카테고리">
        {NOTIFICATION_CATEGORY_FILTERS.map((filter) => {
          const active = activeCategory === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveCategory(filter.id)}
              className={cn(
                "shrink-0 rounded-[var(--radius-control)] border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-brand-primary bg-brand-subtle text-brand-primary"
                  : "border-border-default bg-white text-text-muted hover:border-brand-primary hover:text-brand-primary",
              )}
            >
              {filter.label} {counts[filter.id].toLocaleString("ko-KR")}
            </button>
          );
        })}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="rounded-lg border border-border-default bg-white px-4 py-8 text-center text-sm text-text-muted">
          이 카테고리 알림이 없습니다.
        </div>
      ) : (
      <ul className="space-y-2">
        {filteredNotifications.map((notification) => {
          const Icon = iconMap[notification.type] || Bell;
          const isUnread = !notification.readAt;
          const categoryLabel = notificationCategoryLabel(notification.type);
          const category = notificationCategory(notification.type);

          return (
            <li
              key={notification.id}
              className={cn(
                "group flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                isUnread && "bg-muted/30",
              )}
              onClick={() =>
                handleNotificationClick(notification.id, notification.linkUrl)
              }
            >
              <div
                className={cn(
                  "mt-0.5 shrink-0",
                  isUnread ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <p
                  className={cn(
                    "text-sm",
                    isUnread && "font-semibold",
                  )}
                >
                  {notification.message}
                </p>
                {/* @MX:NOTE 서버(Node ICU)와 클라이언트(브라우저 Intl)의 ko-KR 포맷 미세 차이로
                    hydration mismatch 발생 → 시간 텍스트 노드만 경고 억제. */}
                <p
                  className="text-xs text-muted-foreground"
                  suppressHydrationWarning
                >
                  {formatDateTime(notification.createdAt)}
                </p>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    categoryTagClass[category] ?? categoryTagClass.general,
                  )}
                >
                  {categoryLabel}
                </span>
                {isUnread ? (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}
