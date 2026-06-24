import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[var(--radius-control)] border border-border-strong bg-white px-3.5 py-2",
        "text-sm leading-5 text-text-default",
        "placeholder:text-neutral-400",
        "transition-colors outline-none",
        "hover:border-neutral-400",
        "focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-neutral-400",
        "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/20",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Input }
