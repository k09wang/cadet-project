-- SPEC-016 Phase 2: creator payout settings.

CREATE TYPE "CreatorPayoutBusinessType" AS ENUM (
  'PERSONAL',
  'SOLE_PROPRIETOR',
  'CORPORATION'
);

CREATE TYPE "PayoutVerificationStatus" AS ENUM (
  'PENDING_VERIFICATION',
  'VERIFIED',
  'NEEDS_REVIEW'
);

CREATE TABLE "creator_payout_accounts" (
  "id" TEXT NOT NULL,
  "creator_profile_id" TEXT NOT NULL,
  "business_type" "CreatorPayoutBusinessType" NOT NULL DEFAULT 'PERSONAL',
  "bank_name" TEXT NOT NULL,
  "account_holder" TEXT NOT NULL,
  "account_number_masked" TEXT NOT NULL,
  "account_number_last4" TEXT NOT NULL,
  "business_registration_no" TEXT,
  "verification_status" "PayoutVerificationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "creator_payout_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creator_payout_accounts_creator_profile_id_key"
  ON "creator_payout_accounts"("creator_profile_id");

CREATE INDEX "creator_payout_accounts_verification_status_idx"
  ON "creator_payout_accounts"("verification_status");

ALTER TABLE "creator_payout_accounts"
  ADD CONSTRAINT "creator_payout_accounts_creator_profile_id_fkey"
  FOREIGN KEY ("creator_profile_id")
  REFERENCES "creator_profiles"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
