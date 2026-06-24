import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * 크리에이터 카드 (SPEC-002 FR-002).
 * Presentational component — null-safe 렌더링 (NFR-004).
 * 클릭 시 /creators/{id}로 이동.
 */
export interface CreatorCardProps {
  creator: {
    id: string;
    studioName: string;
    bio?: string | null;
    profileImageUrl?: string | null;
    category?: string | null;
  };
  entryTab?: "intro" | "posts" | "membership" | "artworks" | "club" | "community";
}

export function CreatorCard({ creator, entryTab }: CreatorCardProps) {
  const href = entryTab
    ? `/creators/${creator.id}?tab=${entryTab}`
    : `/creators/${creator.id}`;

  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full">
        {creator.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.profileImageUrl}
            alt={creator.studioName}
            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-brand-subtle text-xl font-bold text-brand-primary">
            {creator.studioName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <CardHeader className="gap-2">
          <CardTitle className="line-clamp-1">{creator.studioName}</CardTitle>
          {creator.category ? (
            <Badge variant="default" className="w-fit">
              {creator.category}
            </Badge>
          ) : null}
        </CardHeader>
        {creator.bio ? (
          <CardContent>
            <p className="line-clamp-2 text-sm leading-5 text-text-muted">{creator.bio}</p>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}
