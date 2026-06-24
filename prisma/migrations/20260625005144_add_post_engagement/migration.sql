-- Post engagement support: likes and comments on creator posts.

CREATE TABLE "post_likes" (
  "id" TEXT NOT NULL,
  "post_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_likes_post_id_user_id_key"
  ON "post_likes"("post_id", "user_id");

CREATE INDEX "post_likes_user_id_idx"
  ON "post_likes"("user_id");

ALTER TABLE "post_likes"
  ADD CONSTRAINT "post_likes_post_id_fkey"
  FOREIGN KEY ("post_id")
  REFERENCES "posts"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "post_likes"
  ADD CONSTRAINT "post_likes_user_id_fkey"
  FOREIGN KEY ("user_id")
  REFERENCES "users"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

CREATE TABLE "post_comments" (
  "id" TEXT NOT NULL,
  "post_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "post_comments_post_id_created_at_idx"
  ON "post_comments"("post_id", "created_at");

CREATE INDEX "post_comments_author_id_idx"
  ON "post_comments"("author_id");

ALTER TABLE "post_comments"
  ADD CONSTRAINT "post_comments_post_id_fkey"
  FOREIGN KEY ("post_id")
  REFERENCES "posts"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "post_comments"
  ADD CONSTRAINT "post_comments_author_id_fkey"
  FOREIGN KEY ("author_id")
  REFERENCES "users"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
