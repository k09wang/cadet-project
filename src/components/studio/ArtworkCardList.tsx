"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatKrw } from "@/components/studio/MembershipPlanCardList";

export interface ArtworkCardListProps {
  artworks: Array<{
    id: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    priceKrw: number;
    stock: number;
  }>;
}

export function ArtworkCardList({ artworks }: ArtworkCardListProps) {
  if (artworks.length === 0) {
    return <p className="text-sm text-text-muted">판매 중인 작품이 없습니다.</p>;
  }

  return (
    <ul className="grid gap-4">
      {artworks.map((artwork) => (
        <li key={artwork.id}>
          <Card className="overflow-hidden">
            {artwork.imageUrl ? (
              <div
                role="img"
                aria-label={artwork.title}
                className="h-48 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${artwork.imageUrl})` }}
              />
            ) : null}
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{artwork.title}</CardTitle>
                <Badge variant="program">작품</Badge>
              </div>
              <p className="text-sm font-bold text-text-default">
                {formatKrw(artwork.priceKrw)} · 재고 {artwork.stock.toLocaleString("ko-KR")}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {artwork.description ? (
                <p className="line-clamp-3 text-sm leading-5 text-text-muted">
                  {artwork.description}
                </p>
              ) : null}
            </CardContent>
            <CardFooter className="block space-y-3">
              {artwork.stock > 0 ? (
                <Link
                  href={`/artworks/${artwork.id}/checkout`}
                  className={buttonVariants({ size: "sm", className: "w-full" })}
                >
                  구매하기
                </Link>
              ) : (
                <Button size="sm" className="w-full" disabled={artwork.stock <= 0}>
                  품절
                </Button>
              )}
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  );
}
