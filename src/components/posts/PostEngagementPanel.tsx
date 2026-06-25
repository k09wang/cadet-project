"use client";

import { useState, useTransition } from "react";
import { Heart, MessageCircle, Send, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentItem } from "@/components/community/CommentItem";

interface PostCommentListItem {
  id: string;
  body: string;
  createdAt?: Date | string;
  author: {
    name: string;
  };
  likesCount?: number;
}

interface ViewerInfo {
  id: string;
  name: string;
  role: "FAN" | "CREATOR";
}

interface PostEngagementPanelProps {
  postId: string;
  initialLikesCount: number;
  initialLiked: boolean;
  initialComments: PostCommentListItem[];
  currentUser: ViewerInfo | null;
}

export function PostEngagementPanel({
  postId,
  initialLikesCount,
  initialLiked,
  initialComments,
  currentUser,
}: PostEngagementPanelProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [comments, setComments] = useState(initialComments);
  const [commentBody, setCommentBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleLike() {
    if (!currentUser) {
      setNotice("좋아요는 로그인 후 사용할 수 있습니다.");
      return;
    }

    startTransition(async () => {
      setNotice(null);
      const res = await fetch(`/api/posts/${postId}/likes`, { method: "POST" });
      if (!res.ok) {
        setNotice("좋아요 처리에 실패했습니다.");
        return;
      }

      const data = (await res.json()) as { liked: boolean };
      setLiked(data.liked);
      setLikesCount((current) => {
        if (data.liked && !liked) return current + 1;
        if (!data.liked && liked) return Math.max(0, current - 1);
        return current;
      });
    });
  }

  function submitComment() {
    if (!currentUser) {
      setNotice("댓글은 로그인 후 남길 수 있습니다.");
      return;
    }
    if (!commentBody.trim()) {
      setNotice("댓글 내용을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      setNotice(null);
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody }),
      });
      if (!res.ok) {
        setNotice("댓글 등록에 실패했습니다.");
        return;
      }

      const created = (await res.json()) as PostCommentListItem;
      setComments((current) => [created, ...current]);
      setCommentBody("");
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("포스트 링크를 복사했습니다.");
    } catch {
      setNotice("링크 복사에 실패했습니다.");
    }
  }

  return (
    <section className="mt-5 space-y-4 border-t border-border-default pt-4">
      <div className="flex flex-wrap items-center gap-2.5 text-[13px] font-medium text-text-muted">
        <button
          type="button"
          onClick={toggleLike}
          disabled={pending}
          aria-label={`좋아요 ${likesCount}`}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:bg-surface-subtle disabled:opacity-60"
        >
          <Heart className={`size-4 ${liked ? "fill-current text-brand-primary" : ""}`} />
          <span>좋아요 {likesCount}</span>
        </button>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="size-4" />
          <span>댓글 {comments.length}</span>
        </span>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:bg-surface-subtle"
        >
          <Share2 className="size-4" />
          <span>공유</span>
        </button>
      </div>

      {currentUser ? (
        <div className="space-y-2">
          <label htmlFor="post-comment" className="sr-only">
            댓글 입력
          </label>
          <textarea
            id="post-comment"
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            placeholder="댓글을 남겨보세요"
            rows={3}
            className="w-full rounded-[var(--radius-control)] border border-border-default px-3 py-2 text-sm text-text-default"
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" disabled={pending} onClick={submitComment}>
              <Send className="size-4" />
              댓글 등록
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-muted">댓글과 좋아요는 로그인 후 사용할 수 있습니다.</p>
      )}

      {notice ? <p className="text-xs text-text-muted">{notice}</p> : null}

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-text-muted">첫 댓글을 남겨보세요.</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              authorName={comment.author.name}
              body={comment.body}
              createdAt={comment.createdAt}
              likes={comment.likesCount ?? 0}
            />
          ))
        )}
      </div>
    </section>
  );
}
