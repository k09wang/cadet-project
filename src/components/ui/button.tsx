import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary text-white hover:bg-brand-primary-hover active:bg-brand-primary-pressed disabled:bg-primary-300 disabled:text-white",
        outline:
          "border-border-strong bg-white text-text-subtle hover:border-brand-primary hover:text-brand-primary active:border-brand-primary-pressed active:text-brand-primary-pressed disabled:border-border-default disabled:text-neutral-400",
        secondary:
          "bg-neutral-100 text-text-subtle hover:bg-neutral-200 active:bg-neutral-300 disabled:text-neutral-400",
        ghost:
          "bg-transparent text-text-subtle hover:bg-neutral-100 active:bg-neutral-200 disabled:text-neutral-400",
        destructive:
          "border-danger bg-white text-danger hover:bg-danger/10 active:bg-danger/20 disabled:border-neutral-400 disabled:text-neutral-400",
        link: "rounded-none px-0 text-brand-primary underline-offset-4 hover:text-brand-primary-hover hover:underline active:text-brand-primary-pressed disabled:text-primary-400",
      },
      size: {
        lg: "h-12 px-5 text-base",
        default: "h-11 px-4 text-sm",
        sm: "h-10 px-3.5 text-[13px]",
        xs: "h-8 px-2.5 text-xs",
        icon: "size-11",
        "icon-xs": "size-8",
        "icon-sm": "size-10",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
