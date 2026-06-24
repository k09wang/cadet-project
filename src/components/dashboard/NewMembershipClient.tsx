"use client";

import { useState } from "react";
import { MembershipPlanForm, type MembershipPlanFormInitial } from "@/components/dashboard/MembershipPlanForm";
import { Button } from "@/components/ui/button";

/**
 * 멤버십 플랜 생성 클라이언트 영역 (SPEC-014 REQ-2-003, REQ-2-004).
 * AI 추천 패널 + MembershipPlanForm 래핑.
 * 추천 반영은 폼 상태만 갱신하고 DB에 저장하지 않는다 (REQ-2-004).
 *
 * NewProgramClient의 remount rev 패턴 참고:
 * MembershipPlanForm(uncontrolled)을 rev 키로 remount하여
 * 갱신된 defaultValue(priceKrw/description)를 반영한다.
 */
export interface NewMembershipClientProps {
  action: (formData: FormData) => void | Promise<void>;
}

interface MembershipSuggestResponse {
  suggestedPrice: number;
  benefits: string[];
  reason: string;
  source: "openai" | "mock";
}

export function NewMembershipClient({ action }: NewMembershipClientProps) {
  const [initial, setInitial] = useState<MembershipPlanFormInitial | undefined>(undefined);
  const [rev, setRev] = useState(0);

  // AI 추천 패널 상태
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MembershipSuggestResponse | null>(null);

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/membership-plans/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          category: category.trim() || undefined,
          targetAudience: targetAudience.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? "추천 요청에 실패했습니다.");
        return;
      }
      const data = (await res.json()) as MembershipSuggestResponse;
      setResult(data);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!result) return;
    // 혜택 목록을 description으로 변환하여 폼에 주입 (REQ-2-003)
    const benefitsText = result.benefits.join("\n");
    const block = `[혜택]\n${benefitsText}\n\n[추천 사유] ${result.reason}`;
    setInitial({
      priceKrw: result.suggestedPrice,
      description: block,
    });
    setRev((r) => r + 1);
    setResult(null);
  }

  const suggestDisabled = loading || description.trim() === "";

  return (
    <div className="space-y-4">
      {/* AI 추천 패널 */}
      <section className="space-y-3 rounded border p-4">
        <h2 className="text-sm font-semibold">AI 가격·혜택 추천</h2>

        <form onSubmit={handleSuggest} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="ms-description">
              멤버십 설명
            </label>
            <textarea
              id="ms-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="예: 일러스트 작가 팬을 위한 월 구독 멤버십"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="ms-category">
                카테고리
              </label>
              <input
                id="ms-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="예: 일러스트"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="ms-audience">
                타깃 멤버
              </label>
              <input
                id="ms-audience"
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="예: 초보 팬"
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={suggestDisabled}>
            {loading ? "AI 추천 생성 중..." : "AI 추천 받기"}
          </Button>
        </form>

        {result ? (
          <div className="space-y-2 rounded border p-3 bg-muted/40">
            {result.source === "mock" ? (
              <p className="text-xs text-muted-foreground">AI 일시적 오류로 기본 추천을 표시합니다.</p>
            ) : null}
            <p className="text-sm font-medium">추천 가격: {result.suggestedPrice.toLocaleString("ko-KR")}원</p>
            <ul className="text-sm space-y-1">
              {result.benefits.map((b, i) => (
                <li key={i} className="text-muted-foreground">• {b}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{result.reason}</p>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleApply}>
                폼에 반영
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setResult(null)}>
                닫기
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {/* 멤버십 생성 폼 — rev로 remount하여 initial 주입 */}
      <MembershipPlanForm key={rev} action={action} initial={initial} />
    </div>
  );
}
