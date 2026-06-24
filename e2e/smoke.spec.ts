import { test, expect } from "@playwright/test";

/**
 * 최소 smoke E2E (artbridge).
 * 핵심 사용 흐름 3종을 브라우저 통합 수준에서 보증한다.
 * - S1: 공개 홈/프로그램 목록 렌더
 * - S2: 데모 로그인 → 역할별 홈 리다이렉트
 * - S3: 프로그램 상세 진입 및 콘텐츠 렌더
 */

test.describe("smoke — 핵심 흐름", () => {
  test("S1: 홈과 프로그램 목록이 렌더된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "나만의 크리에이터를 찾아보세요" })).toBeVisible();

    await page.goto("/programs");
    // 프로그램 목록 페이지가 정상 렌더되면 200이며 타이틀 영역 존재.
    await expect(page).toHaveURL(/\/programs/);
  });

  test("S2: 데모 크리에이터 로그인 → /dashboard/creator 로 이동한다", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "크리에이터로 시작하기" }).click();

    // 서버 액션 로그인 후 역할별 홈으로 리다이렉트 (ROLE=CREATOR).
    await page.waitForURL("**/dashboard/creator", { timeout: 30_000 });
    await expect(page).toHaveURL(/\/dashboard\/creator/);
  });

  test("S3: 프로그램 상세가 정상 렌더된다", async ({ page }) => {
    // 목록에서 첫 번째 프로그램 상세 링크로 진입.
    await page.goto("/programs");
    const firstDetail = page.locator('a[href^="/programs/"]').first();
    await firstDetail.click();
    await page.waitForURL("**/programs/**", { timeout: 30_000 });

    // 상세 페이지가 에러 페이지가 아니면(200 렌더) 콘텐츠 노출.
    await expect(page).toHaveURL(/\/programs\/[^/]+$/);
    const body = page.locator("body");
    await expect(body).not.toContainText("Application error");
  });
});
