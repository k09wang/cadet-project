import { listPublicPrograms, listProgramCategories } from "@/lib/queries/programs";
import { ProgramCard } from "@/components/programs/ProgramCard";
import { ProgramFilter } from "@/components/programs/ProgramFilter";

/**
 * 공개 프로그램 탐색 목록 (SPEC-004 FR-003, AC-002, 7장 /programs).
 * PRD §4.2 P1 — 카테고리·가격대·정렬 필터 + 검색.
 * 필터는 URL searchParams 로 주고받아 서버에서 처리한다 (Next 16 RSC).
 */
interface ProgramsPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    priceMax?: string;
    q?: string;
  }>;
}

const SORT_VALUES = ["latest", "price_asc", "price_desc"] as const;
type SortValue = (typeof SORT_VALUES)[number];

export default async function ProgramsPage({ searchParams }: ProgramsPageProps) {
  const sp = await searchParams;
  const [categories, programs] = await Promise.all([
    listProgramCategories(),
    listPublicPrograms({
      category: sp.category || undefined,
      priceMax: sp.priceMax ? Number(sp.priceMax) : undefined,
      q: sp.q || undefined,
      sort: SORT_VALUES.includes(sp.sort as SortValue) ? (sp.sort as SortValue) : undefined,
    }),
  ]);

  const hasFilter = Boolean(sp.category || sp.sort || sp.priceMax || sp.q);

  return (
    <div className="space-y-6">
      <header className="space-y-2 rounded-[var(--radius-panel)] border border-border-default bg-white px-6 py-8 shadow-[var(--elevation-1)] sm:px-10 sm:py-10">
        <h1 className="font-heading text-[28px] font-bold leading-9 tracking-tight text-text-default sm:text-[32px] sm:leading-10">
          프로그램 탐색
        </h1>
        <p className="text-base leading-6 text-text-muted">
          크리에이터가 여는 클럽·챌린지·클래스를 만나보세요.
        </p>
      </header>

      <ProgramFilter
        categories={categories.map((c) => c.category).filter((c): c is string => Boolean(c))}
        current={{
          category: sp.category,
          sort: sp.sort,
          priceMax: sp.priceMax,
          q: sp.q,
        }}
      />

      {programs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {hasFilter
            ? "조건에 맞는 프로그램이 없습니다. 필터를 바꿔보세요."
            : "아직 공개된 프로그램이 없습니다."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <li key={program.id}>
              <ProgramCard program={program} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
