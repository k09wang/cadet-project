"use client";

import { useState } from "react";

/* ============================================================
   ArtBridge 와이어프레임
   창작자-팬 후원 커뮤니티 서비스의 전체 화면(24개)을
   하나의 페이지에 저충실도 와이어프레임으로 렌더링한다.
   TapTap Design System (Teal/Cyan primary) 기반.
   ============================================================ */

/* ---------- 공통 프리미티브 ---------- */

function Frame({
  no,
  title,
  children,
}: {
  no: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-72 flex-col">
      <div className="mb-1 flex items-center gap-2 px-1">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white">
          {no}
        </span>
        <span className="text-xs font-semibold text-gray-700">{title}</span>
      </div>
      <div className="flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
        {children}
      </div>
    </div>
  );
}

function TopBar({
  title,
  back = false,
  right,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
      {back && <span className="text-gray-500">‹</span>}
      <span className="flex-1 truncate text-sm font-semibold text-gray-800">
        {title}
      </span>
      {right}
    </div>
  );
}

function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "cyan" | "green" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-600",
    cyan: "bg-cyan-100 text-cyan-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-600",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function PrimaryBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white">
      {children}
    </button>
  );
}

function SecondaryBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
      {children}
    </button>
  );
}

function Field({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </span>
      <div className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400">
        {placeholder}
      </div>
    </label>
  );
}

function Avatar({ emoji = "👤" }: { emoji?: string }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-lg">
      {emoji}
    </span>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 space-y-3 overflow-hidden bg-gray-50 p-4">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </p>
  );
}

function BottomNav({ active }: { active: string }) {
  const items = [
    { k: "home", icon: "🏠", label: "홈" },
    { k: "explore", icon: "🔍", label: "탐색" },
    { k: "alert", icon: "🔔", label: "알림" },
    { k: "me", icon: "👤", label: "마이" },
  ];
  return (
    <div className="flex items-center justify-around border-t border-gray-200 bg-white py-2">
      {items.map((it) => (
        <div
          key={it.k}
          className={`flex flex-col items-center text-[10px] ${
            active === it.k ? "text-cyan-600" : "text-gray-400"
          }`}
        >
          <span className="text-base">{it.icon}</span>
          {it.label}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   그룹 1: 인증
   ============================================================ */

// 1. 로그인
function ScreenLogin() {
  return (
    <Frame no={1} title="로그인">
      <div className="flex flex-1 flex-col bg-gradient-to-b from-cyan-50 to-white p-6">
        <div className="mt-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-3xl">
            🎨
          </div>
          <h1 className="text-xl font-bold text-gray-800">ArtBridge</h1>
          <p className="mt-1 text-xs text-gray-500">
            창작자와 팬을 잇는 후원 커뮤니티
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700">
            <span>🟢</span> Google로 계속하기
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-300 py-3 text-sm font-medium text-gray-800">
            <span>💬</span> Kakao로 계속하기
          </button>
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 p-3">
          <SectionTitle>역할 선택</SectionTitle>
          <div className="mt-2 flex gap-2">
            <button className="flex-1 rounded-lg border-2 border-cyan-400 bg-cyan-50 py-2 text-xs font-semibold text-cyan-700">
              🎨 크리에이터
            </button>
            <button className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600">
              💖 팬
            </button>
          </div>
        </div>

        <p className="mt-auto text-center text-[10px] text-gray-400">
          가입 시 이용약관 및 개인정보 처리방침에 동의합니다.
        </p>
      </div>
    </Frame>
  );
}

// 2. 역할 선택
function ScreenRoleSelect() {
  return (
    <Frame no={2} title="역할 선택">
      <TopBar title="시작하기" back />
      <Body>
        <p className="text-center text-sm font-semibold text-gray-800">
          어떻게 시작할까요?
        </p>
        <p className="text-center text-xs text-gray-500">
          나중에 마이페이지에서 변경할 수 있어요
        </p>

        <div className="mt-2 space-y-3">
          <div className="rounded-xl border-2 border-cyan-400 bg-cyan-50 p-4">
            <div className="text-2xl">🎨</div>
            <p className="mt-1 text-sm font-bold text-gray-800">
              크리에이터로 시작
            </p>
            <p className="mt-1 text-xs text-gray-600">
              스튜디오를 개설하고 멤버십·프로그램으로 수익을 만드세요.
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-gray-500">
              <li>✓ 멤버십 플랜 운영</li>
              <li>✓ 프로그램·1:1 클래스 개설</li>
              <li>✓ 정산·계약 관리</li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-300 bg-white p-4">
            <div className="text-2xl">💖</div>
            <p className="mt-1 text-sm font-bold text-gray-800">팬으로 시작</p>
            <p className="mt-1 text-xs text-gray-600">
              좋아하는 창작자를 후원하고 프로그램에 참여하세요.
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-gray-500">
              <li>✓ 크리에이터 탐색·구독</li>
              <li>✓ 프로그램 신청</li>
              <li>✓ 독점 콘텐츠 열람</li>
            </ul>
          </div>
        </div>

        <div className="pt-2">
          <PrimaryBtn>계속하기 →</PrimaryBtn>
        </div>
      </Body>
    </Frame>
  );
}

/* ============================================================
   그룹 2: 크리에이터 스튜디오
   ============================================================ */

// 3. 크리에이터 대시보드
function ScreenDashboard() {
  return (
    <Frame no={3} title="크리에이터 대시보드">
      <TopBar
        title="대시보드"
        right={<Avatar emoji="🎨" />}
      />
      <Body>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] text-gray-500">이번 달 수익 💰</p>
            <p className="text-lg font-bold text-gray-800">₩1,284,000</p>
            <p className="text-[10px] text-green-600">▲ 12% 전월 대비</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] text-gray-500">팔로워 👥</p>
            <p className="text-lg font-bold text-gray-800">2,431</p>
            <p className="text-[10px] text-green-600">▲ 84 신규</p>
          </div>
        </div>

        <div>
          <SectionTitle>빠른 액션</SectionTitle>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { i: "📝", t: "포스트" },
              { i: "🎓", t: "프로그램" },
              { i: "💳", t: "정산" },
            ].map((a) => (
              <div
                key={a.t}
                className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white py-3 text-[11px] text-gray-600"
              >
                <span className="text-lg">{a.i}</span>
                {a.t}
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>최근 포스트</SectionTitle>
          <div className="mt-2 space-y-2">
            {[
              { t: "신작 일러스트 비하인드", v: "1.2K", tone: "cyan" as const },
              { t: "멤버십 전용 브러시 공유", v: "486", tone: "amber" as const },
            ].map((p) => (
              <div
                key={p.t}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2"
              >
                <div className="h-9 w-9 rounded bg-gray-200" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-800">{p.t}</p>
                  <p className="text-[10px] text-gray-400">조회 {p.v}</p>
                </div>
                <Badge tone={p.tone}>
                  {p.tone === "cyan" ? "전체" : "멤버십"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Body>
      <BottomNav active="home" />
    </Frame>
  );
}

// 4. 스튜디오 관리
function ScreenStudioEdit() {
  return (
    <Frame no={4} title="스튜디오 관리">
      <TopBar title="스튜디오 편집" back right={<Badge tone="cyan">저장</Badge>} />
      <Body>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex h-20 items-center justify-center bg-gradient-to-r from-cyan-200 to-cyan-400 text-xs text-white">
            배너 이미지 업로드 📷
          </div>
          <div className="flex items-center gap-3 p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow">
              🎨
            </div>
            <SecondaryBtn>아이콘 변경</SecondaryBtn>
          </div>
        </div>

        <Field label="스튜디오 이름" placeholder="김지수 일러스트 스튜디오" />
        <Field label="카테고리" placeholder="일러스트레이션 ▾" />

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            소개글
          </span>
          <div className="h-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400">
            감성 일러스트와 브러시를 공유하는 공간입니다...
          </div>
        </label>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
          <span className="text-xs text-gray-700">스튜디오 공개</span>
          <div className="flex h-5 w-9 items-center rounded-full bg-cyan-500 px-0.5">
            <div className="ml-auto h-4 w-4 rounded-full bg-white" />
          </div>
        </div>

        <PrimaryBtn>변경사항 저장</PrimaryBtn>
      </Body>
    </Frame>
  );
}

// 5. 멤버십 플랜 관리
function ScreenMembershipPlans() {
  const plans = [
    { n: "브론즈", p: "₩3,900", c: "amber" as const, m: "1,204명" },
    { n: "실버", p: "₩9,900", c: "gray" as const, m: "532명" },
    { n: "골드", p: "₩19,900", c: "cyan" as const, m: "118명" },
  ];
  return (
    <Frame no={5} title="멤버십 플랜 관리">
      <TopBar
        title="멤버십 플랜"
        back
        right={<span className="text-lg text-cyan-600">＋</span>}
      />
      <Body>
        <SectionTitle>운영 중인 플랜</SectionTitle>
        {plans.map((pl) => (
          <div
            key={pl.n}
            className="rounded-xl border border-gray-200 bg-white p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge tone={pl.c}>{pl.n}</Badge>
                <span className="text-sm font-bold text-gray-800">
                  {pl.p}
                  <span className="text-[10px] font-normal text-gray-400">
                    {" "}
                    / 월
                  </span>
                </span>
              </div>
              <span className="text-[11px] text-gray-400">멤버 {pl.m}</span>
            </div>
            <ul className="mt-2 space-y-0.5 text-[11px] text-gray-500">
              <li>✓ 멤버십 전용 포스트</li>
              <li>✓ 월간 굿즈 추첨</li>
            </ul>
            <div className="mt-2 flex gap-2">
              <button className="flex-1 rounded-lg border border-gray-300 py-1.5 text-[11px] text-gray-600">
                ✏️ 수정
              </button>
              <button className="flex-1 rounded-lg border border-red-200 py-1.5 text-[11px] text-red-500">
                🗑️ 삭제
              </button>
            </div>
          </div>
        ))}
        <button className="w-full rounded-lg border-2 border-dashed border-cyan-300 py-3 text-xs font-medium text-cyan-600">
          ＋ 새 플랜 만들기
        </button>
      </Body>
    </Frame>
  );
}

// 6. AI 가격 추천 (다이얼로그)
function ScreenAiPricing() {
  return (
    <Frame no={6} title="AI 가격 추천">
      <div className="flex flex-1 flex-col bg-gray-900/40 p-4">
        <div className="mt-auto rounded-2xl bg-white p-4 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <p className="text-sm font-bold text-gray-800">AI 가격·혜택 추천</p>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            카테고리·팔로워·시장 데이터를 기반으로 추천했어요.
          </p>

          <div className="mt-3 space-y-2">
            {[
              { n: "입문", p: "₩4,900", d: "신규 팬 유입 최적" },
              { n: "코어", p: "₩11,900", d: "추천 — 수익 균형", best: true },
              { n: "프리미엄", p: "₩24,900", d: "충성 팬 타깃" },
            ].map((r) => (
              <div
                key={r.n}
                className={`rounded-lg border p-2 ${
                  r.best
                    ? "border-cyan-400 bg-cyan-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800">
                    {r.n} {r.best && <Badge tone="cyan">추천</Badge>}
                  </span>
                  <span className="text-sm font-bold text-cyan-600">{r.p}</span>
                </div>
                <p className="text-[10px] text-gray-500">{r.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg bg-amber-50 p-2 text-[10px] text-amber-700">
            💡 혜택 제안: 멤버 전용 라이브 + 월간 PSD 소스 제공 시 전환율 +18%
          </div>

          <div className="mt-3 flex gap-2">
            <SecondaryBtn>닫기</SecondaryBtn>
            <PrimaryBtn>추천 적용</PrimaryBtn>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// 7. 포스트 작성
function ScreenPostCompose() {
  return (
    <Frame no={7} title="포스트 작성">
      <TopBar
        title="새 포스트"
        back
        right={<Badge tone="cyan">게시</Badge>}
      />
      <Body>
        <Field label="제목" placeholder="제목을 입력하세요" />

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            내용
          </span>
          <div className="h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400">
            팬들에게 전할 이야기를 작성하세요...
          </div>
        </label>

        <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400">
          <span className="text-2xl">🖼️</span>
          <span className="text-[11px]">이미지 추가</span>
        </div>

        <div>
          <SectionTitle>공개 설정</SectionTitle>
          <div className="mt-2 space-y-2">
            {[
              { i: "🌐", t: "전체 공개", on: true },
              { i: "💎", t: "멤버십 전용", on: false },
              { i: "💰", t: "유료 (₩2,900)", on: false },
            ].map((o) => (
              <div
                key={o.t}
                className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
                  o.on
                    ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                <span>{o.i}</span>
                <span className="flex-1">{o.t}</span>
                <span
                  className={`h-3 w-3 rounded-full ${
                    o.on ? "bg-cyan-500" : "border border-gray-300"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <PrimaryBtn>게시하기</PrimaryBtn>
      </Body>
    </Frame>
  );
}

/* ============================================================
   그룹 3: 프로그램 운영/거래
   ============================================================ */

// 8. 프로그램 관리
function ScreenProgramManage() {
  const items = [
    { t: "일러스트 마스터 클래스", s: "모집중", tone: "green" as const, a: "12/20" },
    { t: "음악 프로듀싱 1:1 피드백", s: "마감", tone: "gray" as const, a: "8/8" },
    { t: "웹툰 스토리 멘토링", s: "모집중", tone: "green" as const, a: "3/10" },
  ];
  return (
    <Frame no={8} title="프로그램 관리">
      <TopBar
        title="내 프로그램"
        back
        right={<span className="text-lg text-cyan-600">＋</span>}
      />
      <Body>
        <div className="flex gap-2 text-[11px]">
          <Badge tone="cyan">전체 3</Badge>
          <Badge tone="green">모집중 2</Badge>
          <Badge tone="gray">마감 1</Badge>
        </div>
        {items.map((it) => (
          <div
            key={it.t}
            className="rounded-xl border border-gray-200 bg-white p-3"
          >
            <div className="flex items-start justify-between">
              <p className="flex-1 text-xs font-semibold text-gray-800">
                {it.t}
              </p>
              <Badge tone={it.tone}>{it.s}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
              <span>신청 {it.a}</span>
              <span className="text-cyan-600">관리 ›</span>
            </div>
          </div>
        ))}
        <button className="w-full rounded-lg border-2 border-dashed border-cyan-300 py-3 text-xs font-medium text-cyan-600">
          ＋ 프로그램 만들기
        </button>
      </Body>
    </Frame>
  );
}

// 9. 프로그램 생성/수정
function ScreenProgramCreate() {
  return (
    <Frame no={9} title="프로그램 생성/수정">
      <TopBar title="프로그램 만들기" back />
      <Body>
        <Field label="제목" placeholder="일러스트 마스터 클래스" />
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            설명
          </span>
          <div className="h-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400">
            프로그램 커리큘럼과 목표를 작성하세요...
          </div>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Field label="가격" placeholder="₩49,000" />
          <Field label="모집 인원" placeholder="20명" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="시작일" placeholder="2026-07-01" />
          <Field label="종료일" placeholder="2026-07-31" />
        </div>
        <Field label="카테고리" placeholder="일러스트레이션 ▾" />

        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
          <span className="text-xs text-gray-700">계약서 자동 발송</span>
          <div className="flex h-5 w-9 items-center rounded-full bg-cyan-500 px-0.5">
            <div className="ml-auto h-4 w-4 rounded-full bg-white" />
          </div>
        </div>

        <div className="flex gap-2">
          <SecondaryBtn>임시저장</SecondaryBtn>
          <PrimaryBtn>등록하기</PrimaryBtn>
        </div>
      </Body>
    </Frame>
  );
}

// 10. 신청 목록 관리
function ScreenApplications() {
  const apps = [
    { n: "이수아", e: "웹툰 작가 지망", s: "대기", tone: "amber" as const },
    { n: "정민호", e: "취미 일러스트", s: "수락", tone: "green" as const },
    { n: "한가람", e: "포트폴리오 준비", s: "거절", tone: "red" as const },
  ];
  return (
    <Frame no={10} title="신청 목록 관리">
      <TopBar title="신청 관리" back />
      <Body>
        <div className="flex gap-2 text-[11px]">
          <Badge tone="cyan">전체</Badge>
          <Badge tone="amber">대기 1</Badge>
          <Badge tone="green">수락 1</Badge>
          <Badge tone="red">거절 1</Badge>
        </div>
        {apps.map((a) => (
          <div
            key={a.n}
            className="rounded-xl border border-gray-200 bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <Avatar emoji="🙂" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-800">{a.n}</p>
                <p className="text-[10px] text-gray-400">{a.e}</p>
              </div>
              <Badge tone={a.tone}>{a.s}</Badge>
            </div>
            {a.s === "대기" && (
              <div className="mt-2 flex gap-2">
                <button className="flex-1 rounded-lg bg-cyan-500 py-1.5 text-[11px] font-medium text-white">
                  ✅ 수락
                </button>
                <button className="flex-1 rounded-lg border border-red-200 py-1.5 text-[11px] text-red-500">
                  ❌ 거절
                </button>
              </div>
            )}
          </div>
        ))}
      </Body>
    </Frame>
  );
}

// 11. 계약서 관리
function ScreenContracts() {
  const cs = [
    { t: "이수아 · 멘토링 계약", s: "완료", tone: "green" as const },
    { t: "정민호 · 클래스 계약", s: "대기", tone: "amber" as const },
    { t: "한가람 · 1:1 계약", s: "대기", tone: "amber" as const },
  ];
  return (
    <Frame no={11} title="계약서 관리">
      <TopBar title="계약서" back />
      <Body>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[11px] text-gray-500">서명 완료율</p>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-1/3 rounded-full bg-cyan-500" />
          </div>
          <p className="mt-1 text-[10px] text-gray-400">1 / 3 완료</p>
        </div>
        <SectionTitle>계약서 목록</SectionTitle>
        {cs.map((c) => (
          <div
            key={c.t}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3"
          >
            <span className="text-lg">📋</span>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-800">{c.t}</p>
              <p className="text-[10px] text-gray-400">2026-06-21 발송</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge tone={c.tone}>{c.s}</Badge>
              <span className="text-[10px] text-cyan-600">보기 ›</span>
            </div>
          </div>
        ))}
      </Body>
    </Frame>
  );
}

// 12. 결제/정산 현황
function ScreenSettlement() {
  const bars = [40, 55, 35, 70, 60, 90];
  const rows = [
    { t: "6월 멤버십 정산", a: "₩842,000", s: "완료", tone: "green" as const },
    { t: "6월 프로그램 정산", a: "₩442,000", s: "승인 대기", tone: "amber" as const },
  ];
  return (
    <Frame no={12} title="결제/정산 현황">
      <TopBar title="정산" back />
      <Body>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[11px] text-gray-500">월별 수익</p>
          <div className="mt-2 flex h-24 items-end gap-1.5">
            {bars.map((b, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-cyan-400"
                style={{ height: `${b}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-gray-400">
            <span>1월</span>
            <span>6월</span>
          </div>
        </div>
        <SectionTitle>정산 목록</SectionTitle>
        {rows.map((r) => (
          <div
            key={r.t}
            className="rounded-xl border border-gray-200 bg-white p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-800">{r.t}</p>
              <Badge tone={r.tone}>{r.s}</Badge>
            </div>
            <p className="mt-1 text-sm font-bold text-gray-800">{r.a}</p>
            {r.s === "승인 대기" && (
              <button className="mt-2 w-full rounded-lg bg-cyan-500 py-1.5 text-[11px] font-medium text-white">
                정산 완료 승인
              </button>
            )}
          </div>
        ))}
      </Body>
    </Frame>
  );
}

/* ============================================================
   그룹 4: 탐색 및 신청 (팬)
   ============================================================ */

// 13. 탐색 홈
function ScreenExploreHome() {
  return (
    <Frame no={13} title="탐색 홈 (팬)">
      <TopBar title="ArtBridge" right={<span className="text-lg">🔔</span>} />
      <Body>
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-400">
          🔍 크리에이터·프로그램 검색
        </div>

        <div>
          <SectionTitle>추천 크리에이터</SectionTitle>
          <div className="mt-2 flex gap-2 overflow-hidden">
            {[
              { e: "🎨", n: "김지수" },
              { e: "🎵", n: "박준혁" },
              { e: "✏️", n: "이수아" },
            ].map((c) => (
              <div
                key={c.n}
                className="w-20 shrink-0 rounded-xl border border-gray-200 bg-white p-2 text-center"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-lg">
                  {c.e}
                </div>
                <p className="mt-1 text-[11px] font-medium text-gray-700">
                  {c.n}
                </p>
                <button className="mt-1 w-full rounded bg-cyan-500 py-0.5 text-[9px] text-white">
                  팔로우
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>인기 프로그램</SectionTitle>
          <div className="mt-2 space-y-2">
            {[
              { t: "일러스트 마스터 클래스", p: "₩49,000" },
              { t: "음악 프로듀싱 1:1", p: "₩99,000" },
            ].map((p) => (
              <div
                key={p.t}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2"
              >
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-200 to-cyan-400" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-800">{p.t}</p>
                  <p className="text-[11px] font-bold text-cyan-600">{p.p}</p>
                </div>
                <span className="text-gray-300">›</span>
              </div>
            ))}
          </div>
        </div>
      </Body>
      <BottomNav active="explore" />
    </Frame>
  );
}

// 14. 크리에이터 목록
function ScreenCreatorList() {
  const cr = [
    { e: "🎨", n: "김지수", c: "일러스트", f: "2.4K" },
    { e: "🎵", n: "박준혁", c: "음악", f: "1.8K" },
    { e: "✏️", n: "이수아", c: "웹툰", f: "3.1K" },
    { e: "📷", n: "최유진", c: "사진", f: "942" },
  ];
  return (
    <Frame no={14} title="크리에이터 목록">
      <TopBar title="크리에이터" back />
      <Body>
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-400">
          🔍 검색
        </div>
        <div className="flex gap-2 text-[11px]">
          <Badge tone="cyan">전체</Badge>
          <Badge tone="gray">일러스트</Badge>
          <Badge tone="gray">음악</Badge>
          <Badge tone="gray">웹툰</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {cr.map((c) => (
            <div
              key={c.n}
              className="rounded-xl border border-gray-200 bg-white p-3 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-xl">
                {c.e}
              </div>
              <p className="mt-1 text-xs font-semibold text-gray-800">{c.n}</p>
              <Badge tone="gray">{c.c}</Badge>
              <p className="mt-1 text-[10px] text-gray-400">팔로워 {c.f}</p>
            </div>
          ))}
        </div>
      </Body>
      <BottomNav active="explore" />
    </Frame>
  );
}

// 15. 스튜디오 공개 페이지
function ScreenStudioPublic() {
  return (
    <Frame no={15} title="스튜디오 공개">
      <div className="flex h-24 items-end bg-gradient-to-r from-cyan-300 to-cyan-500 p-3">
        <span className="text-xs text-white">‹ 뒤로</span>
      </div>
      <div className="flex-1 overflow-hidden bg-gray-50">
        <div className="-mt-6 px-4">
          <div className="flex items-end gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-cyan-100 text-2xl shadow">
              🎨
            </div>
            <div className="flex-1 pb-1">
              <p className="text-sm font-bold text-gray-800">김지수</p>
              <p className="text-[10px] text-gray-500">일러스트레이터 · 2.4K</p>
            </div>
            <button className="rounded-lg bg-cyan-500 px-3 py-1.5 text-[11px] font-medium text-white">
              팔로우
            </button>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <SectionTitle>멤버십</SectionTitle>
            <div className="mt-2 flex gap-2 overflow-hidden">
              {[
                { n: "브론즈", p: "₩3,900" },
                { n: "실버", p: "₩9,900" },
                { n: "골드", p: "₩19,900" },
              ].map((m) => (
                <div
                  key={m.n}
                  className="w-24 shrink-0 rounded-xl border border-gray-200 bg-white p-2 text-center"
                >
                  <p className="text-[11px] font-semibold text-gray-700">
                    {m.n}
                  </p>
                  <p className="text-xs font-bold text-cyan-600">{m.p}</p>
                  <button className="mt-1 w-full rounded bg-cyan-50 py-0.5 text-[9px] text-cyan-600">
                    가입
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>최신 포스트</SectionTitle>
            <div className="mt-2 grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded bg-gradient-to-br from-gray-200 to-gray-300"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// 16. 포스트 상세
function ScreenPostDetail() {
  return (
    <Frame no={16} title="포스트 상세">
      <TopBar title="포스트" back right={<span>⋯</span>} />
      <Body>
        <div className="flex items-center gap-2">
          <Avatar emoji="🎨" />
          <div>
            <p className="text-xs font-semibold text-gray-800">김지수</p>
            <p className="text-[10px] text-gray-400">3시간 전</p>
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-800">신작 일러스트 비하인드</p>
        <div className="h-32 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-300" />
        <p className="text-xs text-gray-600">
          이번 작업의 컬러 팔레트와 브러시 세팅을 공유합니다...
        </p>

        <div className="relative rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="text-2xl">🔒</div>
          <p className="mt-1 text-xs font-medium text-gray-700">
            멤버십 전용 콘텐츠
          </p>
          <p className="text-[10px] text-gray-400">실버 이상 멤버에게 공개</p>
          <button className="mt-2 rounded-lg bg-cyan-500 px-4 py-1.5 text-[11px] font-medium text-white">
            멤버십 가입하고 보기
          </button>
        </div>

        <div>
          <SectionTitle>댓글 2</SectionTitle>
          {["멋져요! 👏", "브러시 공유 감사합니다"].map((c, i) => (
            <div key={i} className="mt-2 flex gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs">
                🙂
              </span>
              <div className="flex-1 rounded-lg bg-white p-2 text-[11px] text-gray-700">
                {c}
              </div>
            </div>
          ))}
        </div>
      </Body>
    </Frame>
  );
}

// 17. 프로그램 목록
function ScreenProgramList() {
  const ps = [
    { t: "일러스트 마스터 클래스", c: "일러스트", p: "₩49,000" },
    { t: "음악 프로듀싱 1:1 피드백", c: "음악", p: "₩99,000" },
    { t: "웹툰 스토리 멘토링", c: "웹툰", p: "₩39,000" },
  ];
  return (
    <Frame no={17} title="프로그램 목록">
      <TopBar title="프로그램" back />
      <Body>
        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-[11px]">
            <Badge tone="cyan">전체</Badge>
            <Badge tone="gray">일러스트</Badge>
            <Badge tone="gray">음악</Badge>
          </div>
          <span className="text-[11px] text-gray-500">정렬 ▾</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ps.map((p) => (
            <div
              key={p.t}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="h-16 bg-gradient-to-br from-cyan-200 to-cyan-400" />
              <div className="p-2">
                <Badge tone="gray">{p.c}</Badge>
                <p className="mt-1 text-[11px] font-medium leading-tight text-gray-800">
                  {p.t}
                </p>
                <p className="mt-1 text-xs font-bold text-cyan-600">{p.p}</p>
              </div>
            </div>
          ))}
        </div>
      </Body>
      <BottomNav active="explore" />
    </Frame>
  );
}

// 18. 프로그램 상세
function ScreenProgramDetail() {
  return (
    <Frame no={18} title="프로그램 상세">
      <div className="h-32 bg-gradient-to-br from-cyan-300 to-cyan-500 p-3">
        <span className="text-xs text-white">‹ 뒤로</span>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
        <div className="flex-1 space-y-3 overflow-hidden p-4">
          <Badge tone="green">모집중 · 12/20</Badge>
          <p className="text-sm font-bold text-gray-800">
            일러스트 마스터 클래스
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2">
            <Avatar emoji="🎨" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-800">김지수</p>
              <p className="text-[10px] text-gray-400">일러스트레이터</p>
            </div>
            <span className="text-[10px] text-cyan-600">프로필 ›</span>
          </div>
          <div>
            <SectionTitle>프로그램 소개</SectionTitle>
            <p className="mt-1 text-xs text-gray-600">
              4주 과정으로 캐릭터 일러스트의 기초부터 채색까지 다룹니다. 매주
              피드백과 과제가 제공됩니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-gray-200 bg-white p-2">
              📅 2026-07-01 ~ 07-31
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-2">
              👥 모집 20명
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-gray-200 bg-white p-3">
          <div>
            <p className="text-[10px] text-gray-400">참가비</p>
            <p className="text-sm font-bold text-gray-800">₩49,000</p>
          </div>
          <button className="ml-auto rounded-lg bg-cyan-500 px-6 py-2 text-sm font-medium text-white">
            신청하기
          </button>
        </div>
      </div>
    </Frame>
  );
}

// 19. 내 신청 현황
function ScreenMyApplications() {
  const my = [
    { t: "일러스트 마스터 클래스", s: "수락", tone: "green" as const, ct: true },
    { t: "음악 프로듀싱 1:1", s: "검토중", tone: "amber" as const, ct: false },
    { t: "웹툰 스토리 멘토링", s: "거절", tone: "red" as const, ct: false },
  ];
  return (
    <Frame no={19} title="내 신청 현황">
      <TopBar title="내 신청" back />
      <Body>
        <SectionTitle>신청한 프로그램</SectionTitle>
        {my.map((m) => (
          <div
            key={m.t}
            className="rounded-xl border border-gray-200 bg-white p-3"
          >
            <div className="flex items-start justify-between">
              <p className="flex-1 text-xs font-semibold text-gray-800">
                {m.t}
              </p>
              <Badge tone={m.tone}>{m.s}</Badge>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">신청일 2026-06-18</p>
            {m.ct && (
              <button className="mt-2 w-full rounded-lg border border-cyan-300 py-1.5 text-[11px] font-medium text-cyan-600">
                📋 계약서 확인
              </button>
            )}
          </div>
        ))}
      </Body>
      <BottomNav active="me" />
    </Frame>
  );
}

/* ============================================================
   그룹 5: 알림·계약·결제
   ============================================================ */

// 20. 알림 센터
function ScreenNotifications() {
  const ns = [
    { i: "💖", t: "박준혁님이 회원님을 팔로우했습니다", time: "5분 전", unread: true },
    { i: "✅", t: "프로그램 신청이 수락되었습니다", time: "1시간 전", unread: true },
    { i: "💰", t: "6월 멤버십 정산이 완료되었습니다", time: "3시간 전", unread: false },
    { i: "📋", t: "계약서 서명이 완료되었습니다", time: "어제", unread: false },
    { i: "💬", t: "새 댓글이 달렸습니다", time: "2일 전", unread: false },
  ];
  return (
    <Frame no={20} title="알림 센터">
      <TopBar
        title="알림"
        back
        right={<span className="text-[11px] text-cyan-600">전체 읽음</span>}
      />
      <Body>
        {ns.map((n, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 rounded-lg p-3 ${
              n.unread
                ? "border border-cyan-200 bg-cyan-50"
                : "border border-gray-200 bg-white"
            }`}
          >
            <span className="text-lg">{n.i}</span>
            <div className="flex-1">
              <p className="text-xs text-gray-800">{n.t}</p>
              <p className="text-[10px] text-gray-400">{n.time}</p>
            </div>
            {n.unread && (
              <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" />
            )}
          </div>
        ))}
      </Body>
      <BottomNav active="alert" />
    </Frame>
  );
}

// 21. 계약/약관 동의
function ScreenContractAgree() {
  return (
    <Frame no={21} title="계약/약관 동의">
      <TopBar title="계약서 동의" back />
      <Body>
        <div className="h-48 overflow-hidden rounded-lg border border-gray-200 bg-white p-3 text-[11px] leading-relaxed text-gray-600">
          <p className="font-semibold text-gray-800">멘토링 프로그램 계약서</p>
          <p className="mt-2">
            제1조 (목적) 본 계약은 크리에이터 김지수(이하 &quot;갑&quot;)와
            참가자(이하 &quot;을&quot;) 간의 일러스트 마스터 클래스 진행에 관한
            사항을 정한다.
          </p>
          <p className="mt-2">
            제2조 (기간) 2026년 7월 1일부터 7월 31일까지 4주간 진행한다.
          </p>
          <p className="mt-2">
            제3조 (참가비) 을은 갑에게 ₩49,000을 결제하며, 환불은 약관에
            따른다...
          </p>
        </div>

        <div className="space-y-2">
          {[
            "계약 내용을 모두 확인했습니다",
            "환불 정책에 동의합니다",
            "개인정보 제공에 동의합니다",
          ].map((t, i) => (
            <label key={i} className="flex items-center gap-2 text-xs text-gray-700">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  i < 2
                    ? "border-cyan-500 bg-cyan-500 text-white"
                    : "border-gray-300"
                } text-[9px]`}
              >
                {i < 2 ? "✓" : ""}
              </span>
              {t}
            </label>
          ))}
        </div>

        <div className="rounded-lg border-2 border-dashed border-gray-300 p-3 text-center text-xs text-gray-400">
          ✍️ 여기에 서명해주세요
        </div>

        <PrimaryBtn>서명하고 동의</PrimaryBtn>
      </Body>
    </Frame>
  );
}

// 22. Mock 결제
function ScreenPayment() {
  return (
    <Frame no={22} title="Mock 결제">
      <TopBar title="결제" back />
      <Body>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <SectionTitle>결제 요약</SectionTitle>
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>일러스트 마스터 클래스</span>
              <span>₩49,000</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>수수료</span>
              <span>₩0</span>
            </div>
            <div className="my-1 border-t border-dashed border-gray-200" />
            <div className="flex justify-between text-sm font-bold text-gray-800">
              <span>총 결제금액</span>
              <span className="text-cyan-600">₩49,000</span>
            </div>
          </div>
        </div>

        <SectionTitle>카드 정보</SectionTitle>
        <Field label="카드 번호" placeholder="1234 - 5678 - **** - ****" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="유효기간" placeholder="MM / YY" />
          <Field label="CVC" placeholder="***" />
        </div>
        <Field label="카드 소유자" placeholder="홍길동" />

        <div className="rounded-lg bg-amber-50 p-2 text-[10px] text-amber-700">
          ⚠️ Mock 결제입니다. 실제 청구되지 않습니다.
        </div>

        <button className="w-full rounded-lg bg-cyan-500 py-3 text-sm font-bold text-white">
          ₩49,000 결제하기
        </button>
      </Body>
    </Frame>
  );
}

/* ============================================================
   그룹 6: 커뮤니티 및 리뷰
   ============================================================ */

// 23. 커뮤니티
function ScreenCommunity() {
  const tabs = ["공지", "자유", "리뷰"];
  const posts = [
    { tag: "공지", tone: "cyan" as const, t: "7월 정기 업데이트 안내", c: 12 },
    { tag: "자유", tone: "gray" as const, t: "요즘 작업하는 분들 계신가요?", c: 34 },
    { tag: "리뷰", tone: "amber" as const, t: "마스터 클래스 후기 남깁니다 ⭐", c: 8 },
  ];
  return (
    <Frame no={23} title="커뮤니티">
      <TopBar title="커뮤니티" />
      <div className="flex border-b border-gray-200 bg-white">
        {tabs.map((t, i) => (
          <button
            key={t}
            className={`flex-1 py-2 text-xs font-medium ${
              i === 0
                ? "border-b-2 border-cyan-500 text-cyan-600"
                : "text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden bg-gray-50 p-4">
        <div className="space-y-2">
          {posts.map((p) => (
            <div
              key={p.t}
              className="rounded-xl border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <Badge tone={p.tone}>{p.tag}</Badge>
                <span className="text-[10px] text-gray-400">2시간 전</span>
              </div>
              <p className="mt-1 text-xs font-medium text-gray-800">{p.t}</p>
              <div className="mt-1 flex gap-3 text-[10px] text-gray-400">
                <span>💬 {p.c}</span>
                <span>👍 {p.c * 2}</span>
              </div>
            </div>
          ))}
        </div>
        <button className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-xl text-white shadow-lg">
          ＋
        </button>
      </div>
      <BottomNav active="home" />
    </Frame>
  );
}

// 24. 리뷰 작성
function ScreenReviewWrite() {
  return (
    <Frame no={24} title="리뷰 작성">
      <TopBar title="리뷰 작성" back />
      <Body>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <Avatar emoji="🎨" />
            <div>
              <p className="text-xs font-semibold text-gray-800">
                일러스트 마스터 클래스
              </p>
              <p className="text-[10px] text-gray-400">김지수 · 완료됨</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <SectionTitle>별점</SectionTitle>
          <div className="mt-2 text-2xl">
            <span className="text-amber-400">⭐⭐⭐⭐</span>
            <span className="text-gray-300">⭐</span>
          </div>
          <p className="text-[11px] text-gray-500">4.0 / 5.0</p>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            리뷰 내용
          </span>
          <div className="h-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400">
            프로그램에 대한 솔직한 후기를 남겨주세요...
          </div>
        </label>

        <div className="flex flex-wrap gap-1.5">
          {["친절해요", "꼼꼼한 피드백", "유익함", "추천해요"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-cyan-300 bg-cyan-50 px-2 py-0.5 text-[10px] text-cyan-600"
            >
              #{tag}
            </span>
          ))}
        </div>

        <PrimaryBtn>리뷰 제출</PrimaryBtn>
      </Body>
    </Frame>
  );
}

/* ============================================================
   그룹 섹션 래퍼 + 페이지
   ============================================================ */

function Group({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 border-l-4 border-cyan-500 pl-3">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <div className="flex flex-wrap gap-6">{children}</div>
    </section>
  );
}

export default function WireframesPage() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 페이지 헤더 */}
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-xl">
            🎨
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              ArtBridge 와이어프레임
            </h1>
            <p className="text-xs text-gray-500">
              창작자-팬 후원 커뮤니티 · 전체 24개 화면 (TapTap Design System)
            </p>
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600"
          >
            {collapsed ? "유저플로우 펼치기" : "유저플로우 접기"}
          </button>
        </div>

        {!collapsed && (
          <div className="mt-4 rounded-xl bg-cyan-50 p-4 text-xs text-gray-700">
            <p className="font-semibold text-cyan-700">유저 플로우</p>
            <p className="mt-1 leading-relaxed">
              로그인·역할 선택(1-2) → 크리에이터는 스튜디오/멤버십/포스트/프로그램·정산
              운영(3-12), 팬은 탐색·구독·신청(13-19) → 알림·계약·결제(20-22) →
              커뮤니티·리뷰(23-24)로 순환하는 후원 경제 구조.
            </p>
          </div>
        )}
      </header>

      {/* 화면 그룹 */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Group title="1. 인증" desc="로그인과 역할 선택으로 서비스 진입">
          <ScreenLogin />
          <ScreenRoleSelect />
        </Group>

        <Group
          title="2. 크리에이터 스튜디오"
          desc="대시보드·스튜디오·멤버십·AI 추천·포스트 운영"
        >
          <ScreenDashboard />
          <ScreenStudioEdit />
          <ScreenMembershipPlans />
          <ScreenAiPricing />
          <ScreenPostCompose />
        </Group>

        <Group
          title="3. 프로그램 운영/거래"
          desc="프로그램·신청·계약·정산 관리"
        >
          <ScreenProgramManage />
          <ScreenProgramCreate />
          <ScreenApplications />
          <ScreenContracts />
          <ScreenSettlement />
        </Group>

        <Group title="4. 탐색 및 신청 (팬)" desc="탐색·크리에이터·프로그램 신청 동선">
          <ScreenExploreHome />
          <ScreenCreatorList />
          <ScreenStudioPublic />
          <ScreenPostDetail />
          <ScreenProgramList />
          <ScreenProgramDetail />
          <ScreenMyApplications />
        </Group>

        <Group title="5. 알림·계약·결제" desc="알림 센터, 계약 동의, Mock 결제">
          <ScreenNotifications />
          <ScreenContractAgree />
          <ScreenPayment />
        </Group>

        <Group title="6. 커뮤니티 및 리뷰" desc="커뮤니티 게시판과 프로그램 리뷰">
          <ScreenCommunity />
          <ScreenReviewWrite />
        </Group>
      </main>

      <footer className="border-t border-gray-200 bg-white px-6 py-4 text-center text-[11px] text-gray-400">
        ArtBridge 와이어프레임 · 저충실도 화면 설계 (Low-fidelity) · 더미 데이터 기반
      </footer>
    </div>
  );
}
