import { listCreators, listTopRatedCreators } from "@/lib/queries/studio";
import { listPublicPrograms } from "@/lib/queries/programs";
import { CreatorCard } from "@/components/creators/CreatorCard";
import { ProgramCard } from "@/components/programs/ProgramCard";
import { ExploreHero } from "@/components/home/ExploreHero";
import { SectionHeader } from "@/components/home/SectionHeader";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

/**
 * 공개 랜딩(메인 서비스 홈).
 * 비로그인/로그인 공통으로 탐색 콘텐츠를 노출하고, 네비게이션바와 푸터를 포함한다.
 * ISR(revalidate 60s)로 캐싱하여 DB 쿼리 비용을 줄인다.
 */
export const revalidate = 60;

export default async function Home() {
  const [creators, recruitingPrograms, latestPrograms, topRated] = await Promise.all([
    listCreators(),
    listPublicPrograms({ status: "RECRUITING" }),
    listPublicPrograms({ sort: "latest" }),
    listTopRatedCreators(3),
  ]);
  const featuredCreators = creators.slice(0, 3);
  const recruiting = recruitingPrograms.slice(0, 3);
  const latest = latestPrograms.slice(0, 3);

  // 실제 작가 카테고리(아트 도메인)에서 동적으로 추천 필터를 구성한다.
  const categories = Array.from(
    new Set(creators.map((c) => c.category).filter((c): c is string => Boolean(c))),
  ).slice(0, 4);
  const featuredFilters = [
    { label: "전체", href: "/creators", active: true },
    ...categories.map((c) => ({
      label: c,
      href: `/creators?category=${encodeURIComponent(c)}`,
    })),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-10">
        {/* 히어로 */}
        <ExploreHero />

        {/* 추천 크리에이터 */}
        {featuredCreators.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="추천 크리에이터" href="/creators" filters={featuredFilters} />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {featuredCreators.map((creator) => (
                <li key={creator.id}>
                  <CreatorCard creator={creator} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 평점이 좋은 작가 (리뷰가 있을 때만) */}
        {topRated.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="평점이 좋은 작가" href="/creators" />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {topRated.map((creator) => (
                <li key={creator.id}>
                  <CreatorCard creator={creator} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 진행 중인 프로그램 (모집 중) */}
        {recruiting.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="진행 중인 프로그램" href="/programs" />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {recruiting.map((program) => (
                <li key={program.id}>
                  <ProgramCard program={program} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 새로 올라온 프로그램 */}
        {latest.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="새로 올라온 프로그램" href="/programs?sort=latest" />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {latest.map((program) => (
                <li key={program.id}>
                  <ProgramCard program={program} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
