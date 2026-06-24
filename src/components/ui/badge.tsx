import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex min-h-6 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-brand-subtle text-brand-primary-pressed",
        secondary:
          "bg-neutral-100 text-text-subtle",
        outline:
          "border border-border-strong bg-white text-text-subtle",
        primary:
          "bg-brand-primary text-white",
        success:
          "bg-success/10 text-success",
        warning:
          "bg-warning/15 text-warning",
        danger:
          "bg-danger/10 text-danger",
        info:
          "bg-info/10 text-info",
        membership:
          "bg-membership/10 text-membership",
        program:
          "bg-program/10 text-program",
        community:
          "bg-community/10 text-community",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
