import { Heart } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CommentItemProps {
  authorName: string;
  body: string;
  createdAt?: Date | string;
  likes?: number;
  reply?: boolean;
  className?: string;
}

/**
 * Comment/reply row aligned with ArtBridge CommentItem (Figma 56:721/56:731).
 */
export function CommentItem({
  authorName,
  body,
  createdAt,
  likes = 0,
  reply = false,
  className,
}: CommentItemProps) {
  const initial = authorName.slice(0, 1).toUpperCase();
  const dateLabel = formatDateTime(createdAt);

  return (
    <article
      className={cn(
        "flex w-full max-w-[520px] gap-2.5",
        reply && "ml-8 max-w-[488px]",
        className,
      )}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e0fbf9] text-xs font-bold text-brand-primary-pressed"
        aria-hidden="true"
      >
        {initial}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <p className="text-[13px] font-bold leading-[18px] text-text-default">
            {authorName}
          </p>
          {dateLabel ? (
            <p className="text-[11px] leading-4 text-text-muted">{dateLabel}</p>
          ) : null}
        </div>
        <p className="whitespace-pre-wrap text-[13px] leading-[18px] text-text-default">
          {body}
        </p>
        <div className="flex items-center gap-3.5 text-xs font-medium leading-4 text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3 fill-current" />
            {likes}
          </span>
          <button type="button" className="hover:text-brand-primary-pressed">
            답글
          </button>
        </div>
      </div>
    </article>
  );
}
