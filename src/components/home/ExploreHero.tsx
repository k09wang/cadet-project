import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ExploreHeroProps {
  defaultQuery?: string;
}

/**
 * Public discovery hero based on the ArtBridge design system ExploreHero.
 */
export function ExploreHero({ defaultQuery }: ExploreHeroProps) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-panel)] bg-brand-primary-hover px-5 py-10 text-white sm:px-10 sm:py-12 lg:min-h-[280px] lg:px-[60px]">
      <div className="flex max-w-2xl flex-col gap-5">
        <div className="space-y-3">
          <h1 className="font-heading text-[28px] font-bold leading-9 sm:text-[32px] sm:leading-10">
            나만의 크리에이터를 찾아보세요
          </h1>
          <p className="text-base leading-6 text-[#e0f5f5]">
            다양한 분야의 크리에이터와 함께하는 특별한 경험
          </p>
        </div>
        <form action="/creators" className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">크리에이터, 프로그램 검색</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              name="q"
              defaultValue={defaultQuery}
              placeholder="크리에이터, 프로그램 검색..."
              className="h-12 w-full rounded-lg border border-transparent bg-white py-3 pl-10 pr-4 text-sm text-text-default outline-none transition focus-visible:ring-2 focus-visible:ring-white/60"
            />
          </label>
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "bg-white px-5 text-brand-primary-hover hover:bg-white/90"
            )}
          >
            검색
          </button>
        </form>
      </div>
    </section>
  );
}
