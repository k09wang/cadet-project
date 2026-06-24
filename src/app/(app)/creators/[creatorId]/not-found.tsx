import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * 작가 상세 not-found 안내 (관심 작가/탐색에서 접근 불가한 작가 클릭 시).
 * 기본 404 화면 대신 사용자 친화적 안내를 노출한다.
 */
export default function CreatorNotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <h1 className="font-heading text-xl font-bold text-text-default">
        현재 확인할 수 없는 작가입니다
      </h1>
      <p className="text-sm text-text-subtle">
        작가 프로필이 비공개로 전환되었거나 더 이상 존재하지 않습니다.
        다른 작가를 둘러보세요.
      </p>
      <Link href="/creators" className={buttonVariants({ variant: "default" })}>
        작가 둘러보기
      </Link>
    </main>
  );
}
