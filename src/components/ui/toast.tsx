"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const icons = {
  info: <Info className="size-[18px] text-info" />,
  success: <CheckCircle2 className="size-[18px] text-success" />,
  error: <XCircle className="size-[18px] text-danger" />,
  warning: <TriangleAlert className="size-[18px] text-warning" />,
}

const toastVariants = cva(
  "inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] border border-border-strong bg-white px-4 py-3 text-sm leading-5 text-text-subtle shadow-[var(--elevation-layered)]",
  {
    variants: {
      variant: {
        info: "",
        success: "",
        error: "",
        warning: "",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  message: string
  onClose?: () => void
}

function Toast({ className, variant = "info", message, onClose, ...props }: ToastProps) {
  return (
    <div
      role="alert"
      data-slot="toast"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <span className="shrink-0">{icons[variant ?? "info"]}</span>
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="ml-1 flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-text-muted transition-colors hover:bg-neutral-100 hover:text-text-subtle"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function ToastContainer({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Toast, ToastContainer, toastVariants }
