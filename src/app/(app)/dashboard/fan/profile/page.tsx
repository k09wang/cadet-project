import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 팬 내 정보 페이지 — 계정 기본 정보를 확인한다.
 */
export default async function FanProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "FAN") redirect("/dashboard/creator/edit");

  return (
    <main className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">내 정보</h1>
        <p className="mt-1 text-sm text-muted-foreground">계정 기본 정보입니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-[120px_1fr] gap-y-3">
            <span className="text-muted-foreground">이름</span>
            <span className="font-medium">{user.name}</span>
            <span className="text-muted-foreground">이메일</span>
            <span className="font-medium">{user.email}</span>
            <span className="text-muted-foreground">역할</span>
            <span className="inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              팬
            </span>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        정보 수정이 필요하시면{" "}
        <a href="/support" className="underline underline-offset-2">
          고객센터
        </a>
        로 문의해 주세요.
      </p>
    </main>
  );
}
