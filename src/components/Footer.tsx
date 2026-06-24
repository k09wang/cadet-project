import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * 전역 푸터 — 약관·개인정보·고객센터 링크.
 */
export function Footer() {
  return (
    <footer className="mt-auto bg-[#fafafa]">
      <div className="mx-auto flex max-w-6xl flex-col gap-7 px-4 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-8 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Link
              href="/"
              aria-label="ArtBridge 홈"
              className="inline-block text-brand-primary transition-colors hover:text-brand-primary-pressed"
            >
              <Logo className="h-7 w-auto" />
            </Link>
            <p className="text-[13px] text-text-muted">
              창작자와 팬을 잇는 후원 커뮤니티
            </p>
          </div>

          <nav className="grid gap-8 text-[13px] sm:grid-cols-3 sm:gap-16">
            <div className="flex flex-col gap-2.5">
              <p className="font-bold text-text-default">서비스</p>
              <Link href="/creators" className="text-text-muted transition-colors hover:text-brand-primary-pressed">
                크리에이터 탐색
              </Link>
              <Link href="/programs" className="text-text-muted transition-colors hover:text-brand-primary-pressed">
                프로그램
              </Link>
              <Link href="/dashboard/fan/memberships" className="text-text-muted transition-colors hover:text-brand-primary-pressed">
                멤버십
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="font-bold text-text-default">고객지원</p>
              <Link href="/support" className="text-text-muted transition-colors hover:text-brand-primary-pressed">
                도움말
              </Link>
              <Link href="/support" className="text-text-muted transition-colors hover:text-brand-primary-pressed">
                문의하기
              </Link>
              <Link href="/terms" className="text-text-muted transition-colors hover:text-brand-primary-pressed">
                이용약관
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="font-bold text-text-default">회사</p>
              <Link href="/privacy" className="text-text-muted transition-colors hover:text-brand-primary-pressed">
                개인정보처리방침
              </Link>
              <Link href="/support" className="text-text-muted transition-colors hover:text-brand-primary-pressed">
                고객센터
              </Link>
              <Link href="/terms" className="text-text-muted transition-colors hover:text-brand-primary-pressed">
                정책
              </Link>
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-border-default pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-muted">
            © 2026 ArtBridge. All rights reserved.
          </p>
          <div className="flex gap-2" aria-hidden="true">
            <span className="size-4 rounded-full bg-neutral-200" />
            <span className="size-4 rounded-full bg-neutral-200" />
            <span className="size-4 rounded-full bg-neutral-200" />
          </div>
        </div>
      </div>
    </footer>
  );
}
