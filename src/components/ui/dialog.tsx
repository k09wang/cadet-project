"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/* ─── Overlay ─── */
function DialogOverlay({
  className,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClick?: () => void }) {
  return (
    <div
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-[rgba(11,17,19,0.18)] backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      onClick={onClick}
      {...props}
    />
  )
}

/* ─── Panel ─── */
function DialogPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-panel"
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 -translate-y-1/2",
        "flex flex-col gap-4 rounded-[var(--radius-modal)] border border-border-strong bg-white p-6",
        "shadow-[var(--elevation-layered)]",
        className
      )}
      {...props}
    />
  )
}

/* ─── Header ─── */
function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex items-start justify-between gap-3", className)}
      {...props}
    />
  )
}

/* ─── Title ─── */
function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn("text-xl font-bold leading-7 text-text-default", className)}
      {...props}
    />
  )
}

/* ─── Description / Body ─── */
function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-sm leading-5 text-text-muted", className)}
      {...props}
    />
  )
}

/* ─── Footer (button row) ─── */
function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-wrap items-center justify-end gap-2 pt-1", className)}
      {...props}
    />
  )
}

/* ─── Close button (X) ─── */
function DialogCloseButton({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="닫기"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-text-muted transition-colors hover:bg-neutral-100 hover:text-text-subtle",
        className
      )}
    >
      <X className="size-4" />
    </button>
  )
}

/* ─── Root ─── */
interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null
  return (
    <>
      <DialogOverlay onClick={() => onOpenChange?.(false)} />
      {children}
    </>
  )
}

export {
  Dialog,
  DialogOverlay,
  DialogPanel,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogCloseButton,
}
