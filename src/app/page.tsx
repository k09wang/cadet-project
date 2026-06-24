import {
  listCreators,
  listLockedPosts,
  listPopularMembershipPlans,
  listTopRatedCreators,
} from "@/lib/queries/studio";
import { listPublicPrograms } from "@/lib/queries/programs";
import { ProgramCard } from "@/components/programs/ProgramCard";
import { ExploreHero } from "@/components/home/ExploreHero";
import {
  CompactThumbCard,
  FeatureBannerCard,
  ListRowProgramCard,
  LockedPostCard,
  MembershipPlanPreviewCard,
} from "@/components/home/HomeCards";
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
  const [
    creators,
    recruitingPrograms,
    latestPrograms,
    topRated,
    lockedPosts,
    membershipPlans,
  ] = await Promise.all([
    listCreators(),
    listPublicPrograms({ status: "RECRUITING" }),
    listPublicPrograms({ sort: "latest" }),
    listTopRatedCreators(4),
    listLockedPosts(3),
    listPopularMembershipPlans(3),
  ]);
  const featuredCreators = creators.slice(0, 3);
  const recruitingRows = recruitingPrograms.slice(0, 6);
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
      <main className="mx-auto w-full max-w-[1200px] flex-1 space-y-10 px-4 py-10 sm:space-y-12 sm:py-14">
        {/* 히어로 */}
        <ExploreHero />

        {/* 추천 크리에이터 */}
        {featuredCreators.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="추천 크리에이터" href="/creators" filters={featuredFilters} />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {featuredCreators.map((creator, index) => (
                <li key={creator.id}>
                  <FeatureBannerCard creator={creator} index={index} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 평점이 좋은 작가 (리뷰가 있을 때만) */}
        {topRated.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="평점이 좋은 작가" href="/creators" />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topRated.map((creator, index) => (
                <li key={creator.id}>
                  <CompactThumbCard creator={creator} index={index} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 진행 중인 프로그램 (모집 중) */}
        {recruitingRows.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="진행 중인 프로그램" href="/programs" />
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {recruitingRows.map((program) => (
                <li key={program.id}>
                  <ListRowProgramCard program={program} />
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

        {/* 멤버 전용 포스트 */}
        {lockedPosts.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="멤버에게 인기 있는 포스트" href="/creators" />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {lockedPosts.map((post) => (
                <li key={post.id}>
                  <LockedPostCard post={post} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 인기 멤버십 플랜 */}
        {membershipPlans.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="인기 멤버십 플랜" href="/creators" />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {membershipPlans.map((plan) => (
                <li key={plan.id}>
                  <MembershipPlanPreviewCard plan={plan} />
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
