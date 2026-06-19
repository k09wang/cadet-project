import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";

/**
 * 공개 랜딩 페이지.
 * 로그인 여부에 따라 CTA 를 노출한다.
 * 미로그인 → 역할별 시작 CTA + 작가 둘러보기, 로그인 → 역할별 홈.
 * 역할별 홈: CREATOR → /dashboard/creator, FAN → /creators.
 */
export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    const homeHref =
      user.role === "CREATOR" ? "/dashboard/creator" : "/creators";
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-4xl font-bold tracking-tight">ArtBridge</h1>
        <p className="max-w-md text-center text-muted-foreground">
          다시 돌아오셨네요. 이어서 계속해 볼까요?
        </p>
        <Link
          href={homeHref}
          className={buttonVariants({ size: "lg" })}
        >
          내 페이지로 이동
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">ArtBridge</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          신진 작가는 작품·멤버십·프로그램으로 수익을 만들고, 팬은 좋아하는
          작가를 후원하고 클래스와 클럽에 참여하는 양면형 거래 플랫폼.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          시작하기
        </Link>
        <Link
          href="/creators"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          작가 둘러보기
        </Link>
      </div>

      <p className="text-xs text-gray-500">데모 체험 중 — 일부 기능은 제한될 수 있습니다</p>
    </main>
  );
}
