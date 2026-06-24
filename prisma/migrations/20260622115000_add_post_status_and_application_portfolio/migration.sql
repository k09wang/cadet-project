-- ArtBridge UI flow support: draft posts and optional application portfolio URL.

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "posts"
  ADD COLUMN "status" "PostStatus" NOT NULL DEFAULT 'PUBLISHED';

-- CreateIndex
CREATE INDEX "posts_creator_profile_id_status_created_at_idx"
  ON "posts"("creator_profile_id", "status", "created_at");

-- AlterTable
ALTER TABLE "program_applications"
  ADD COLUMN "portfolio_url" TEXT;
