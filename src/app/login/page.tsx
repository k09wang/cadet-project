import { loginAsCreator, loginAsFan } from "./actions";
import { LoginForm } from "./LoginForm";

/**
 * 데모 로그인 페이지 (SPEC-001 FR-001).
 * 두 역할(크리에이터/팬) 카드로 즉시 입장 — 별도 가입 절차 없이 체험.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background p-8">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">ArtBridge</h1>
        <p className="text-sm text-muted-foreground">
          어느 역할로 체험해 볼까요? 나중에 언제든 바꿀 수 있어요.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {/* FR-002: creator login. */}
        <LoginForm
          action={loginAsCreator}
          title="크리에이터로 시작하기"
          description="스튜디오 · 멤버십 · 프로그램을 관리합니다"
          buttonLabel="크리에이터로 입장"
        />

        {/* FR-003: fan login. */}
        <LoginForm
          action={loginAsFan}
          title="팬으로 시작하기"
          description="작가와 프로그램을 둘러보고 참여합니다"
          buttonLabel="팬으로 입장"
          variant="outline"
        />
      </div>

      <p className="text-xs text-gray-500">
        데모 계정으로 바로 입장합니다 · 별도 가입·비밀번호 없이 체험 가능
      </p>
    </main>
  );
}
