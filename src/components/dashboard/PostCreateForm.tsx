import {
  PostComposer,
  type PostComposerProps,
} from "@/components/posts/PostComposer";

/**
 * 포스트 작성 폼 (SPEC-003 FR-012, FR-013).
 * Figma ArtBridge "PostComposer" 디자인 기준 (node 25:761).
 *
 * 공개 범위는 세그먼티드 컨트롤(전체 공개 / 멤버십 한정 / 유료)로 선택하며,
 * 유료 선택 시 콘텐츠 가격 입력 필드를 노출한다.
 */
export function PostCreateForm(props: PostComposerProps) {
  return <PostComposer {...props} />;
}
