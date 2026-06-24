import type { ReactNode } from "react";
import { AtSign, ExternalLink, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface StudioProfileHeaderProps {
  studio: {
    studioName: string;
    bio?: string | null;
    category?: string | null;
    coverImageUrl?: string | null;
    profileImageUrl?: string | null;
    instagramUrl?: string | null;
    websiteUrl?: string | null;
    posts?: Array<unknown>;
    programs?: Array<unknown>;
  };
  isActiveMember?: boolean;
  rating?: { avg: number | null; count: number };
  action?: ReactNode;
}

/**
 * Public studio header based on the ArtBridge design system StudioProfileHeader.
 */
export function StudioProfileHeader({
  studio,
  isActiveMember = false,
  rating,
  action,
}: StudioProfileHeaderProps) {
  const postCount = studio.posts?.length ?? 0;
  const programCount = studio.programs?.length ?? 0;
  const ratingLabel =
    rating && rating.avg !== null ? rating.avg.toFixed(1) : rating?.count ? "0.0" : null;

  return (
    <header className="overflow-hidden rounded-[var(--radius-card)] border border-border-default bg-white">
      <div className="h-[156px] bg-brand-subtle sm:h-[200px]">
        {studio.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={studio.coverImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="-mt-9 size-16 shrink-0 overflow-hidden rounded-full border-4 border-white bg-neutral-200 sm:mt-0 sm:border-0">
            {studio.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={studio.profileImageUrl}
                alt={studio.studioName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-text-muted">
                {studio.studioName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-lg font-bold leading-6 text-text-default">
                {studio.studioName}
              </h1>
              {isActiveMember ? <Badge variant="membership">멤버</Badge> : null}
              {studio.category ? <Badge variant="default">{studio.category}</Badge> : null}
            </div>
            <p className="line-clamp-2 text-[13px] leading-[18px] text-text-muted">
              {studio.bio ?? "작가 소개가 없습니다."}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-4 text-text-subtle">
              <span>포스트 {postCount}</span>
              <span>클럽 {programCount}</span>
              {ratingLabel ? (
                <span className="inline-flex items-center gap-1 font-medium text-warning">
                  <Star className="size-3 fill-current" />
                  {ratingLabel}
                </span>
              ) : null}
              {studio.instagramUrl ? (
                <a
                  href={studio.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-brand-primary-hover"
                >
                  <AtSign className="size-3.5" />
                  Instagram
                </a>
              ) : null}
              {studio.websiteUrl ? (
                <a
                  href={studio.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-brand-primary-hover"
                >
                  <ExternalLink className="size-3.5" />
                  Website
                </a>
              ) : null}
            </div>
          </div>
        </div>
        {action ? <div className="shrink-0 self-start sm:self-center">{action}</div> : null}
      </div>
    </header>
  );
}
