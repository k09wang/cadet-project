"use server";

import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { clearSession, setSessionCookie } from "@/lib/session";

/**
 * Mock login (SPEC-001 FR-002, FR-003).
 *
 * Picks a seeded user matching the requested role and establishes it as the
 * current session. Creators are restricted to those with a linked
 * CreatorProfile (FR-009), then redirects to the role's landing page.
 *
 * 데모 계정이 없으면(예: DB 미시드) throw 대신 `{ error }` 를 반환해
 * 로그인 폼이 인라인 에러 메시지를 노출하도록 한다 (F4: silent failure 개선).
 *
 * @param seedIndex optional zero-based index into the matching seed users,
 *   useful for switching between multiple demo creators/fans mid-demo.
 */
export type LoginState = { error: string } | undefined;

export async function loginAs(
  role: Role,
  seedIndex = 0,
): Promise<LoginState> {
  const users = await prisma.user.findMany({
    where:
      role === "CREATOR"
        ? { role, creatorProfile: { isNot: null } }
        : { role },
    include: { creatorProfile: true },
    orderBy: { createdAt: "asc" },
  });

  const user = users[seedIndex] ?? users[0];
  if (!user) {
    // @MX:NOTE: SPEC-001 — 시드 누락 시 사용자에게 안내. redirect/setSession 없음.
    const roleLabel = role === "CREATOR" ? "크리에이터" : "팬";
    return {
      error: `${roleLabel} 데모 계정을 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.`,
    };
  }

  await setSessionCookie(user.id);
  redirect(role === "CREATOR" ? "/dashboard/creator" : "/creators");
}

/** Mock logout (SPEC-001 FR-007). */
export async function logout(): Promise<void> {
  await clearSession();
  redirect("/login");
}

// Role-specific wrappers so login <form action={...}> can bind directly (FR-001).
export async function loginAsCreator(): Promise<LoginState> {
  return loginAs("CREATOR");
}

export async function loginAsFan(): Promise<LoginState> {
  return loginAs("FAN");
}
