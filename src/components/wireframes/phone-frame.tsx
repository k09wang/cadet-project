import * as React from "react"
import { cn } from "@/lib/utils"

/* ============================================================
   PhoneFrame — TapTap Design System 기반 모바일 쉘
   와이어프레임/프리뷰 페이지에서 375px 모바일 화면을
   일관되게 렌더링하기 위한 레이아웃 프리미티브.
   ============================================================ */

/* ---------- 그리드 라벨 래퍼 ---------- */
export function ScreenCard({
  no,
  group,
  title,
  desc,
  children,
  className,
}: {
  no: number
  group?: string
  title: string
  desc?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-start gap-2 px-1">
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#15c5ce] px-1.5 text-xs font-bold text-white">
          {no}
        </span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-[#1f1f1f]">{title}</span>
            {group && (
              <span className="rounded-full bg-[#eefcfc] px-1.5 py-0.5 text-[10px] font-medium text-[#00abb6]">
                {group}
              </span>
            )}
          </div>
          {desc && <span className="text-xs text-[#8e8e8e]">{desc}</span>}
        </div>
      </div>
      {children}
    </div>
  )
}

/* ---------- 상태바 ---------- */
export function StatusBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 items-center justify-between bg-white px-5 text-[12px] font-semibold text-[#1f1f1f]",
        className
      )}
    >
      <span>9:41</span>
      <div className="flex items-center gap-1 text-[#1f1f1f]">
        {/* signal */}
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <rect x="0" y="7" width="2.5" height="3" rx="0.5" fill="currentColor" />
          <rect x="3.5" y="5" width="2.5" height="5" rx="0.5" fill="currentColor" />
          <rect x="7" y="3" width="2.5" height="7" rx="0.5" fill="currentColor" />
          <rect x="10.5" y="0.5" width="2.5" height="9.5" rx="0.5" fill="currentColor" />
        </svg>
        {/* wifi */}
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path d="M7 9.2a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />
          <path d="M2.2 4.6a7 7 0 019.6 0M4 6.4a4.5 4.5 0 016 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {/* battery */}
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
          <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="13" height="7" rx="1.2" fill="currentColor" />
          <rect x="19.5" y="3.5" width="2" height="4" rx="1" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    </div>
  )
}

/* ---------- 상단 앱 바 ---------- */
export function TopBar({
  title,
  subtitle,
  back = false,
  right,
  className,
}: {
  title: string
  subtitle?: string
  back?: boolean
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-12 items-center gap-2 border-b border-[#eeeeee] bg-white px-3",
        className
      )}
    >
      {back && (
        <button
          type="button"
          aria-label="뒤로"
          className="flex size-8 items-center justify-center rounded-full text-[#4b4b4b] hover:bg-[#f5f5f5]"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 4L6.5 10L12.5 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] font-semibold text-[#1f1f1f]">{title}</span>
        {subtitle && <span className="truncate text-[11px] text-[#8e8e8e]">{subtitle}</span>}
      </div>
      {right}
    </div>
  )
}

/* ---------- 하단 탭 바 ---------- */
export function BottomNav({
  items,
  active,
  className,
}: {
  items: { key: string; label: string; icon: React.ReactNode }[]
  active: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-stretch border-t border-[#eeeeee] bg-white px-2 pb-5 pt-2",
        className
      )}
    >
      {items.map((it) => {
        const on = it.key === active
        return (
          <button
            key={it.key}
            type="button"
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors",
              on ? "text-[#15c5ce]" : "text-[#8e8e8e]"
            )}
          >
            <span className={cn(on && "text-[#15c5ce]")}>{it.icon}</span>
            <span>{it.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- 상단 탭 (세그먼트) ---------- */
export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: string[]
  active: string
  onChange?: (k: string) => void
  className?: string
}) {
  return (
    <div className={cn("flex border-b border-[#eeeeee] bg-white", className)}>
      {items.map((it) => {
        const on = it === active
        return (
          <button
            key={it}
            type="button"
            onClick={() => onChange?.(it)}
            className={cn(
              "relative flex-1 px-3 py-2.5 text-[13px] font-medium transition-colors",
              on ? "text-[#15c5ce]" : "text-[#8e8e8e]"
            )}
          >
            {it}
            {on && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#15c5ce]" />
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- 폰 프레임 (375px 쉘) ---------- */
export function PhoneFrame({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode
  className?: string
  tone?: "default" | "muted"
}) {
  return (
    <div
      className={cn(
        "flex w-[300px] flex-col overflow-hidden rounded-[28px] border border-[#e1e1e1] bg-white",
        "shadow-[0px_2px_20px_rgba(0,0,0,0.04),0px_8px_32px_rgba(0,0,0,0.08)]",
        tone === "muted" && "bg-[#fafafa]",
        className
      )}
    >
      {children}
    </div>
  )
}

/* ---------- 섹션 헤더 (그룹 타이틀) ---------- */
export function GroupHeader({
  no,
  title,
  desc,
}: {
  no: string
  title: string
  desc?: string
}) {
  return (
    <div className="col-span-full flex items-center gap-3 border-t border-[#eeeeee] pt-8">
      <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-[#1f1f1f] px-2 text-xs font-bold text-white">
        {no}
      </span>
      <div className="flex flex-col">
        <span className="text-base font-bold text-[#1f1f1f]">{title}</span>
        {desc && <span className="text-xs text-[#8e8e8e]">{desc}</span>}
      </div>
    </div>
  )
}
