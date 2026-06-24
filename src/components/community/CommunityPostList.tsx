/**
 * 커뮤니티 글 목록 (SPEC-007 FR-003, AC-002, AC-004).
 * 제목, 작성자명, 작성일(ko locale), 본문을 최신순으로 렌더링한다.
 */
import { CommentItem } from "@/components/community/CommentItem";
interface CommunityPost {
  id: string;
  title: string;
  content: string;
  createdAt: Date | string;
  author: { id: string; name: string };
}

interface CommunityPostListProps {
  posts: CommunityPost[];
}

export function CommunityPostList({ posts }: CommunityPostListProps) {
  if (posts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        아직 글이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article
          key={post.id}
          className="space-y-3 rounded-[var(--radius-card)] border border-border-default bg-white p-4"
        >
          <h3 className="text-sm font-bold text-text-default">{post.title}</h3>
          <CommentItem
            authorName={post.author.name}
            body={post.content}
            createdAt={post.createdAt}
          />
        </article>
      ))}
    </div>
  );
}
