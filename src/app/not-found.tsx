import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground/30">404</p>
      <h2 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h2>
      <p className="text-sm text-muted-foreground">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="mt-2 text-sm font-medium underline underline-offset-2"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
