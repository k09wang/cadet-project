import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { PostVisibility } from "@prisma/client";

/**
 * 포스트 가시성 배지 라벨 (SPEC-002).
 */
export function visibilityLabel(v: PostVisibility): string {
  switch (v) {
    case "PUBLIC":
      return "공개";
    case "MEMBER_ONLY":
      return "멤버 전용";
    case "PAID":
      return "유료";
    default:
      return v;
  }
}

const VISIBILITY_VARIANT: Record<PostVisibility, BadgeProps["variant"]> = {
  PUBLIC: "default",
  MEMBER_ONLY: "membership",
  PAID: "warning",
};

export interface PostCardListProps {
  posts: Array<{
    id: string;
    title: string;
    body?: string | null;
    visibility: PostVisibility;
    priceKrw?: number | null;
  }>;
}

export function PostCardList({ posts }: PostCardListProps) {
  if (posts.length === 0) {
    return <p className="text-sm text-text-muted">아직 포스트가 없습니다.</p>;
  }
  return (
    <ul className="grid gap-3">
      {posts.map((post) => (
        <li key={post.id}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <Badge variant={VISIBILITY_VARIANT[post.visibility]}>
                  {visibilityLabel(post.visibility)}
                </Badge>
              </div>
            </CardHeader>
            {post.body ? (
              <CardContent>
                <p className="line-clamp-3 text-sm leading-5 text-text-muted">{post.body}</p>
              </CardContent>
            ) : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}
