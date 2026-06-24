import Link from "next/link";
import { SignupForm } from "./SignupForm";
import { register } from "./actions";

/**
 * 회원가입 페이지 (SPEC-AUTH).
 * 역할 선택 + 이메일/비밀번호. 가입 성공 시 자동 로그인 후 역할별 홈으로.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-surface-canvas px-4 py-10">
      <Link
        href="/"
        aria-label="ArtBridge 홈으로"
        className="font-heading text-2xl font-bold text-brand-primary transition-colors hover:text-brand-primary-pressed"
      >
        ArtBridge
      </Link>
      <section className="w-full max-w-[680px] space-y-5 rounded-lg border border-border-default bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-[max-width] has-[input[name=role]]:max-w-[480px]">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-2xl font-bold leading-9 text-text-default">
            회원가입
          </h1>
          <p className="text-sm leading-5 text-text-muted">
            어떤 활동으로 시작할지 선택하세요
          </p>
        </div>

        <div className="space-y-4">
          <SignupForm action={register} callbackUrl={callbackUrl} />
          <p className="text-center text-sm leading-5 text-text-muted">
            이미 계정이 있나요?{" "}
            <Link
              href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
              className="font-bold text-brand-primary hover:text-brand-primary-pressed"
            >
              로그인
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
