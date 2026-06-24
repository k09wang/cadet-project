import { listCreators } from "@/lib/queries/studio";
import { CreatorCard } from "@/components/creators/CreatorCard";
import { ExploreHero } from "@/components/home/ExploreHero";
import { SectionHeader } from "@/components/home/SectionHeader";

type CreatorsSearchParams = { q?: string; category?: string; tab?: string };

/**
 * 크리에이터 탐색 페이지 (SPEC-002 FR-002, AC-001).
 * 공개 페이지 — 로그인 여부와 무관하게 크리에이터 카드 그리드를 렌더링.
 */
export default async function CreatorsPage({
  searchParams,
}: {
  searchParams?: Promise<CreatorsSearchParams>;
}) {
  const resolvedSearch = await (searchParams ?? Promise.resolve<CreatorsSearchParams>({}));
  const query = resolvedSearch.q?.trim() ?? "";
  const category = resolvedSearch.category?.trim() ?? "";
  const entryTab = resolvedSearch.tab === "artworks" ? "artworks" : undefined;
  const creators = await listCreators();
  const categories = Array.from(
    new Set(creators.map((creator) => creator.category).filter(Boolean))
  ) as string[];
  const normalizedQuery = query.toLocaleLowerCase("ko-KR");
  const filteredCreators = creators.filter((creator) => {
    const matchesCategory = category ? creator.category === category : true;
    const matchesQuery = normalizedQuery
      ? [creator.studioName, creator.bio, creator.category]
          .filter(Boolean)
          .some((value) => value?.toLocaleLowerCase("ko-KR").includes(normalizedQuery))
      : true;

    return matchesCategory && matchesQuery;
  });
  const filters = [
    {
      label: "전체",
      href: buildCreatorsHref({ q: query, tab: entryTab }),
      active: !category,
    },
    ...categories.map((item) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (entryTab) params.set("tab", entryTab);
      params.set("category", item);
      return {
        label: item,
        href: `/creators?${params.toString()}`,
        active: category === item,
      };
    }),
  ];

  return (
    <div className="space-y-8">
      <ExploreHero defaultQuery={query} />
      <section className="space-y-4">
        <SectionHeader
          title={entryTab === "artworks" ? "작품 구매 가능한 크리에이터" : "추천 크리에이터"}
          filters={filters}
        />
        {filteredCreators.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-border-default bg-white px-4 py-6 text-sm text-text-muted">
            조건에 맞는 작가가 없습니다.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCreators.map((creator) => (
              <li key={creator.id}>
                <CreatorCard creator={creator} entryTab={entryTab} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function buildCreatorsHref({ q, tab }: { q?: string; tab?: string }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tab) params.set("tab", tab);
  const query = params.toString();
  return query ? `/creators?${query}` : "/creators";
}
