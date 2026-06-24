import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Component,
  LayoutTemplate,
  Palette,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const brandTokens = [
  {
    name: "Brand/Primary",
    hex: "#15C5CE",
    note: "main CTA",
    className: "bg-[#15C5CE]",
  },
  {
    name: "Brand/Strong",
    hex: "#00ABB6",
    note: "active",
    className: "bg-[#00ABB6]",
  },
  {
    name: "Accent/Subtle",
    hex: "#EEFCFC",
    note: "selected bg",
    className: "bg-[#EEFCFC]",
  },
  {
    name: "Surface/Canvas",
    hex: "#F7FBFA",
    note: "page bg",
    className: "bg-[#F7FBFA]",
  },
];

const typeScale = [
  {
    label: "Display",
    className: "text-[42px] font-semibold leading-[1.05] tracking-[-0.04em]",
    sample: "Pretendard Display",
    detail: "42/44 · hero headline",
  },
  {
    label: "Heading",
    className: "text-[28px] font-semibold leading-[1.15] tracking-[-0.03em]",
    sample: "Pretendard Heading",
    detail: "28/32 · section title",
  },
  {
    label: "Body",
    className: "text-[16px] font-medium leading-7",
    sample: "Pretendard Body keeps product copy crisp and calm.",
    detail: "16/28 · default paragraph",
  },
  {
    label: "Meta",
    className: "text-[13px] font-medium leading-5 text-text-muted",
    sample: "Status, hint text, helper copy",
    detail: "13/20 · system hint",
  },
];

const navItems = ["Explore", "Programs", "Community", "Design System"];

const listItems = [
  { title: "Creator profile card", meta: "Avatar · rating · tag cluster", status: "Ready" },
  { title: "Program summary row", meta: "Price · deadline · CTA state", status: "Planned" },
  { title: "Purchase confirmation modal", meta: "Title · amount · fee note", status: "Ready" },
];

function SectionShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-[28px] border border-border-default bg-white p-6 shadow-[var(--elevation-1)] sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary-pressed">
          {eyebrow}
        </p>
        <div className="space-y-2">
          <h2 className="font-heading text-[28px] font-semibold leading-8 text-text-default">
            {title}
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TokenCard({
  name,
  hex,
  note,
  className,
}: {
  name: string;
  hex: string;
  note: string;
  className: string;
}) {
  return (
    <div className="rounded-[24px] border border-border-default bg-white p-5 shadow-[var(--elevation-1)]">
      <div className="flex items-center gap-5">
        <div className={`h-24 w-24 rounded-[24px] border border-black/5 ${className}`} />
        <div className="space-y-2">
          <p className="text-[15px] font-semibold text-text-default">{name}</p>
          <p className="text-[15px] text-text-muted">
            {hex} <span className="text-neutral-400">· {note}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function TopNavigationPreview() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border-default bg-[#F7FBFA] shadow-[var(--elevation-1)]">
      <div className="flex flex-col gap-5 border-b border-border-default bg-white/90 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-lg font-semibold text-white">
            A
          </div>
          <div>
            <p className="font-heading text-lg font-semibold text-text-default">ArtBridge DS</p>
            <p className="text-sm text-text-muted">Pretendard + aqua token system</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const active = item === "Design System";
            return (
              <span
                key={item}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#EEFCFC] text-[#00ABB6]"
                    : "text-text-muted hover:bg-brand-subtle hover:text-brand-primary-pressed",
                ].join(" ")}
              >
                {item}
              </span>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Overview
          </Button>
          <Button size="sm">Build Now</Button>
        </div>
      </div>
      <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="border-border-strong bg-white">
          <CardHeader>
            <Badge variant="primary" className="w-fit">
              Navigation
            </Badge>
            <CardTitle>상단 네비 기준의 정보 구조</CardTitle>
            <CardDescription>
              사이드바가 아니라 상단 탐색을 기준으로, active 상태는 `#00ABB6`, selected surface는
              `#EEFCFC`로 정의합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge>Default link</Badge>
              <Badge variant="primary">Active route</Badge>
              <Badge variant="outline">Utility action</Badge>
            </div>
            <div className="rounded-[20px] border border-border-default bg-surface-canvas p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary text-white">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-default">Global header rhythm</p>
                  <p className="text-sm text-text-muted">
                    Brand block, navigation cluster, utility buttons, account entry.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-strong bg-white">
          <CardHeader>
            <Badge variant="community" className="w-fit">
              Tokens
            </Badge>
            <CardTitle>즉시 적용 기준</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-muted">
            <div className="flex items-center justify-between rounded-2xl bg-brand-subtle px-4 py-3">
              <span>Primary CTA</span>
              <strong className="text-brand-primary">#15C5CE</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-brand-subtle px-4 py-3">
              <span>Active text</span>
              <strong className="text-brand-primary-pressed">#00ABB6</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-brand-subtle px-4 py-3">
              <span>Selected bg</span>
              <strong className="text-text-subtle">#EEFCFC</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InputPreview() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-border-strong">
        <CardHeader>
          <Badge variant="program" className="w-fit">
            Form
          </Badge>
          <CardTitle>입력 필드와 검색 패턴</CardTitle>
          <CardDescription>
            상단 탐색과 제작 플로우 양쪽에 공통으로 쓸 수 있는 필드 밀도와 helper text 기준입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-text-default">검색</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
              <Input className="h-12 rounded-[16px] border-border-strong pl-10" placeholder="크리에이터, 프로그램, 태그 검색" />
            </div>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-text-default">이름</span>
              <Input className="h-12 rounded-[16px] border-border-strong" placeholder="프로젝트 이름" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-text-default">카테고리</span>
              <div className="flex h-12 items-center justify-between rounded-[16px] border border-border-strong bg-white px-4 text-sm text-text-muted">
                일러스트
                <ChevronDown className="size-4" />
              </div>
            </label>
          </div>
          <p className="text-sm leading-6 text-text-muted">
            Helper text는 13px 기준으로 유지하고, 필드 간격은 16px, 모듈 섹션 간격은 24px로 통일합니다.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border-strong">
        <CardHeader>
          <Badge variant="warning" className="w-fit">
            Selection
          </Badge>
          <CardTitle>체크/필터 패턴</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["구매 CTA 노출", "멤버십 배지 강조", "커뮤니티 상태 알림"].map((label, index) => (
            <label key={label} className="flex items-center gap-3 rounded-2xl border border-border-default px-4 py-3">
              <input
                defaultChecked={index !== 2}
                type="checkbox"
                className="h-4 w-4 rounded border-border-strong accent-[#00ABB6]"
              />
              <span className="text-sm text-text-default">{label}</span>
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ModalPreview() {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-border-strong bg-[linear-gradient(135deg,#f7fbfa_0%,#ffffff_52%,#eefcfc_100%)]">
        <CardHeader>
          <Badge variant="info" className="w-fit">
            Modal
          </Badge>
          <CardTitle>구매/확인 모달 레이아웃</CardTitle>
          <CardDescription>
            실제 구현 시 기존 다이얼로그 프리미티브에 바로 연결할 수 있도록 패널 간격과 버튼 조합을 먼저 정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[24px] border border-border-strong bg-white p-6 shadow-[var(--elevation-layered)]">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-text-default">포스트 구매 확인</p>
                  <p className="mt-1 text-sm leading-6 text-text-muted">
                    결제는 Mock 흐름이지만, 실제 화면 밀도와 경고 문구 위치는 이 페이지 기준으로 통일합니다.
                  </p>
                </div>
                <Badge variant="outline">Preview</Badge>
              </div>
              <div className="rounded-[20px] bg-surface-canvas p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">구매 금액</span>
                  <strong className="text-text-default">₩5,000</strong>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-text-muted">수수료 안내</span>
                  <span className="text-text-subtle">10% 정책 동일 적용</span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="outline">취소</Button>
              <Button>구매하기</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border-strong">
        <CardHeader>
          <Badge variant="membership" className="w-fit">
            Composition
          </Badge>
          <CardTitle>바로 이어질 컴포넌트 목록</CardTitle>
          <CardDescription>
            다음 단계에서는 여기서 보인 조각들을 실제 재사용 컴포넌트로 추출합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {listItems.map((item) => (
            <div
              key={item.title}
              className="flex items-start justify-between gap-4 rounded-[20px] border border-border-default bg-white px-4 py-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-default">{item.title}</p>
                <p className="text-sm text-text-muted">{item.meta}</p>
              </div>
              <Badge variant={item.status === "Ready" ? "success" : "secondary"}>{item.status}</Badge>
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-sm text-text-muted">다음 단계: primitives 추출</span>
          <Link
            href="/wireframes"
            className="text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary-pressed"
          >
            기존 와이어프레임 보기
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export function DesignSystemShowcase() {
  return (
    <div className="space-y-8 font-sans">
      <section className="overflow-hidden rounded-[32px] border border-border-default bg-[linear-gradient(135deg,#ffffff_0%,#f7fbfa_42%,#eefcfc_100%)] px-6 py-8 shadow-[var(--elevation-2)] sm:px-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">Design System Alpha</Badge>
              <Badge variant="outline">Figma Source Expanded</Badge>
              <Badge variant="secondary">Top Navigation First</Badge>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl font-heading text-[42px] font-semibold leading-[1.04] tracking-[-0.04em] text-text-default">
                ArtBridge용 상단 네비 기반 디자인 시스템 시작점
              </h1>
              <p className="max-w-2xl text-base leading-7 text-text-muted">
                Figma 파일의 `Layout`, `Checkbox`, `List`, `Typography` 구조를 참고하되, 실제 제품 적용은
                ArtBridge의 aqua 계열 토큰과 `Pretendard` 타이포, 상단 탐색 패턴을 기준으로 재정렬합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg">토큰 확정</Button>
              <Button variant="outline" size="lg">
                컴포넌트 제작 준비
              </Button>
            </div>
          </div>

          <Card className="border-border-strong bg-white/90 backdrop-blur">
            <CardHeader>
              <Badge variant="default" className="w-fit">
                Included Now
              </Badge>
              <CardTitle>이번 페이지에서 고정할 것</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-text-muted">
              <div className="flex items-center gap-3 rounded-[20px] bg-surface-canvas px-4 py-3">
                <Palette className="size-4 text-brand-primary-pressed" />
                컬러 토큰 우선순위
              </div>
              <div className="flex items-center gap-3 rounded-[20px] bg-surface-canvas px-4 py-3">
                <LayoutTemplate className="size-4 text-brand-primary-pressed" />
                상단 네비 / 섹션 구조
              </div>
              <div className="flex items-center gap-3 rounded-[20px] bg-surface-canvas px-4 py-3">
                <Component className="size-4 text-brand-primary-pressed" />
                입력 / 모달 / 리스트 프리뷰
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SectionShell
        eyebrow="Foundations"
        title="컬러와 타이포부터 기준을 고정합니다"
        description="첨부해주신 색상 카드의 역할을 그대로 가져오고, 이후 컴포넌트는 이 토큰을 직접 참조하게 만듭니다."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {brandTokens.map((token) => (
            <TokenCard key={token.name} {...token} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {typeScale.map((item) => (
            <Card key={item.label} className="border-border-strong">
              <CardHeader>
                <Badge variant="outline" className="w-fit">
                  {item.label}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={item.className}>{item.sample}</p>
                <p className="text-sm text-text-muted">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Navigation"
        title="사이드바 대신 상단 네비를 기본 패턴으로 둡니다"
        description="메인 제품의 방향과 맞추기 위해 탐색은 수평 그룹으로 통일하고, 상세 페이지에서는 탭/필터도 같은 축의 상태 색을 공유하게 합니다."
      >
        <TopNavigationPreview />
      </SectionShell>

      <SectionShell
        eyebrow="Controls"
        title="입력, 선택, 확인 패턴을 먼저 정리합니다"
        description="다음 단계에서 실제 재사용 컴포넌트를 뽑기 전에, 입력 필드와 선택 상태의 시각 규칙을 한 페이지에서 먼저 잠급니다."
      >
        <InputPreview />
      </SectionShell>

      <SectionShell
        eyebrow="Compositions"
        title="모달과 리스트까지 한 번에 검토 가능한 조합"
        description="이 페이지는 단순 샘플 모음이 아니라 이후 구현 순서를 잡는 작업판 역할도 겸합니다."
      >
        <ModalPreview />
      </SectionShell>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-border-default bg-white px-6 py-5 shadow-[var(--elevation-1)]">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-default">다음 단계 제안</p>
          <p className="text-sm text-text-muted">
            Header nav, search bar, filter chip, modal shell, list item부터 실제 컴포넌트로 추출
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">
            <Star className="mr-1 size-3.5" />
            Foundation Ready
          </Badge>
          <Badge variant="info">
            <Bell className="mr-1 size-3.5" />
            Component Build Next
          </Badge>
        </div>
      </section>
    </div>
  );
}
