"use client";

import { useActionState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LoginState } from "@/app/login/actions";

/**
 * 역할 선택 로그인 카드 (F4: silent failure 개선).
 * useActionState 로 서버 액션의 { error } 를 잡아 인라인 에러 메시지를 노출한다.
 * 서버 액션은 성공 시 redirect (클라이언트 이동), 실패(예: 시드 누락) 시 { error } 반환.
 */
interface LoginFormProps {
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
  title: string;
  description: string;
  buttonLabel: string;
  variant?: "default" | "outline";
}

export function LoginForm({
  action,
  title,
  description,
  buttonLabel,
  variant = "default",
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction}>
      <Card className="h-full transition hover:ring-foreground/20">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            type="submit"
            size="lg"
            variant={variant}
            className="w-full"
            disabled={pending}
          >
            {pending ? "이동 중…" : buttonLabel}
          </Button>
          {state?.error ? (
            <p role="alert" className="text-center text-xs text-destructive">
              {state.error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </form>
  );
}
