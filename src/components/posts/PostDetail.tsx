import { Heart, MessageCircle, Share2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";

/**
 * 포스트 전체 본문 표시 컴포넌트 (SPEC-003 FR-010, AC-002, AC-004, AC-005).
 * canViewPost === true 일 때만 렌더링된다.
 */
export interface PostDetailProps {
  post: {
    id: string;
    title: string;
    body: string;
    visibility: string;
    createdAt?: Date | string;
    creatorProfile?: {
      studioName: string;
      profileImageUrl?: string | null;
    } | null;
  };
}

export function PostDetail({ post }: PostDetailProps) {
  const studioName = post.creatorProfile?.studioName ?? "ArtBridge Studio";
  const createdAt = formatDateTime(post.createdAt) ?? null;

  return (
    <article className="mx-auto max-w-[552px] rounded-[var(--radius-card)] border border-border-default bg-white p-5">
      <header className="flex items-center gap-2.5">
        {post.creatorProfile?.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.creatorProfile.profileImageUrl}
            alt=""
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <span className="size-10 rounded-full bg-[#e0fbf9]" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text-default">{studioName}</p>
          {createdAt ? (
            <p className="text-xs text-text-muted">{createdAt}</p>
          ) : null}
        </div>
      </header>

      <div className="mt-4 space-y-3.5">
        <h1 className="text-lg font-bold leading-7 text-text-default">{post.title}</h1>
        <div className="whitespace-pre-wrap text-sm leading-6 text-text-default">
          {post.body}
        </div>
        <div className="aspect-[16/7.5] w-full rounded-lg bg-[#e0fbf9]" aria-hidden="true" />
      </div>

      <footer className="mt-3.5 flex items-center gap-5 border-t border-border-default pt-3.5 text-[13px] font-medium text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Heart className="size-4" />
          좋아요 0
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="size-4" />
          댓글 0
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Share2 className="size-4" />
          공유
        </span>
      </footer>
    </article>
  );
}
