-- SPEC-015: expanded user-flow data model alignment.
-- Adds membership lifecycle state, first-come-first-served program payment
-- states, settlement ledger details, artwork commerce models, and payment
-- source links for program applications and artwork orders.

-- Enum extensions. Keep legacy values for backward compatibility.
ALTER TYPE "ProgramApplicationStatus" ADD VALUE IF NOT EXISTS 'RESERVED';
ALTER TYPE "ProgramApplicationStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "ProgramApplicationStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_FAILED';
ALTER TYPE "ProgramApplicationStatus" ADD VALUE IF NOT EXISTS 'REMOVED';

ALTER TYPE "SettlementStatus" ADD VALUE IF NOT EXISTS 'AVAILABLE';
ALTER TYPE "SettlementStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';
ALTER TYPE "SettlementStatus" ADD VALUE IF NOT EXISTS 'ADJUSTED';

DO $$ BEGIN
  CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAYMENT_FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ArtworkStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RESERVED', 'SOLD', 'HIDDEN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ArtworkReservationStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONVERTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ArtworkOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'RECEIVED', 'CANCELLED', 'REFUNDED', 'ISSUE_OPENED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ArtworkIssueType" AS ENUM ('NOT_DELIVERED', 'DAMAGED', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'REFUND_REQUEST', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ArtworkIssueStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SettlementAdjustmentType" AS ENUM ('REFUND_DEDUCTION', 'HOLD', 'RELEASE', 'MANUAL_ADJUSTMENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Membership lifecycle.
ALTER TABLE "memberships" ADD COLUMN IF NOT EXISTS "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "memberships" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
ALTER TABLE "memberships" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP(3);
ALTER TABLE "memberships" ADD COLUMN IF NOT EXISTS "last_payment_id" TEXT;
CREATE INDEX IF NOT EXISTS "memberships_status_expires_at_idx" ON "memberships"("status", "expires_at");

-- Program seat reservation and payment states.
ALTER TABLE "program_applications" ADD COLUMN IF NOT EXISTS "payment_expires_at" TIMESTAMP(3);
ALTER TABLE "program_applications" ADD COLUMN IF NOT EXISTS "payment_failed_at" TIMESTAMP(3);
ALTER TABLE "program_applications" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP(3);
ALTER TABLE "program_applications" ADD COLUMN IF NOT EXISTS "removed_at" TIMESTAMP(3);
ALTER TABLE "program_applications" ADD COLUMN IF NOT EXISTS "removed_reason" TEXT;

-- Settlement ledger details.
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "source_type" TEXT;
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "source_id" TEXT;
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "gross_amount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "fee_krw" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "available_at" TIMESTAMP(3);
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "released_at" TIMESTAMP(3);
ALTER TABLE "settlements" ADD COLUMN IF NOT EXISTS "held_reason" TEXT;
CREATE INDEX IF NOT EXISTS "settlements_source_type_source_id_idx" ON "settlements"("source_type", "source_id");
CREATE INDEX IF NOT EXISTS "settlements_status_available_at_idx" ON "settlements"("status", "available_at");

CREATE TABLE IF NOT EXISTS "settlement_adjustments" (
  "id" TEXT NOT NULL,
  "settlement_id" TEXT NOT NULL,
  "type" "SettlementAdjustmentType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "settlement_adjustments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "settlement_adjustments_settlement_id_type_idx" ON "settlement_adjustments"("settlement_id", "type");
ALTER TABLE "settlement_adjustments"
  ADD CONSTRAINT "settlement_adjustments_settlement_id_fkey"
  FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Creator portfolio and artwork commerce.
CREATE TABLE IF NOT EXISTS "creator_works" (
  "id" TEXT NOT NULL,
  "creator_profile_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "kind" TEXT,
  "description" TEXT,
  "image_url" TEXT,
  "external_url" TEXT,
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "creator_works_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "creator_works_creator_profile_id_started_at_idx" ON "creator_works"("creator_profile_id", "started_at");
ALTER TABLE "creator_works"
  ADD CONSTRAINT "creator_works_creator_profile_id_fkey"
  FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "artworks" (
  "id" TEXT NOT NULL,
  "creator_profile_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "image_url" TEXT,
  "price_krw" INTEGER NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 1,
  "status" "ArtworkStatus" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artworks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "artworks_creator_profile_id_status_created_at_idx" ON "artworks"("creator_profile_id", "status", "created_at");
ALTER TABLE "artworks"
  ADD CONSTRAINT "artworks_creator_profile_id_fkey"
  FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "artwork_inventory_reservations" (
  "id" TEXT NOT NULL,
  "artwork_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "status" "ArtworkReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artwork_inventory_reservations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "artwork_inventory_reservations_artwork_id_status_expires_at_idx" ON "artwork_inventory_reservations"("artwork_id", "status", "expires_at");
CREATE INDEX IF NOT EXISTS "artwork_inventory_reservations_user_id_status_idx" ON "artwork_inventory_reservations"("user_id", "status");
ALTER TABLE "artwork_inventory_reservations"
  ADD CONSTRAINT "artwork_inventory_reservations_artwork_id_fkey"
  FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artwork_inventory_reservations"
  ADD CONSTRAINT "artwork_inventory_reservations_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "artwork_orders" (
  "id" TEXT NOT NULL,
  "artwork_id" TEXT NOT NULL,
  "fan_user_id" TEXT NOT NULL,
  "status" "ArtworkOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "recipient_name" TEXT NOT NULL,
  "recipient_phone" TEXT NOT NULL,
  "shipping_address" TEXT NOT NULL,
  "shipping_memo" TEXT,
  "item_amount" INTEGER NOT NULL,
  "shipping_fee_krw" INTEGER NOT NULL DEFAULT 0,
  "total_amount" INTEGER NOT NULL,
  "paid_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "refund_reason" TEXT,
  "received_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artwork_orders_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "artwork_orders_fan_user_id_status_created_at_idx" ON "artwork_orders"("fan_user_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "artwork_orders_artwork_id_status_idx" ON "artwork_orders"("artwork_id", "status");
ALTER TABLE "artwork_orders"
  ADD CONSTRAINT "artwork_orders_artwork_id_fkey"
  FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "artwork_orders"
  ADD CONSTRAINT "artwork_orders_fan_user_id_fkey"
  FOREIGN KEY ("fan_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "artwork_shipments" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "carrier" TEXT NOT NULL,
  "tracking_no" TEXT NOT NULL,
  "shipped_at" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artwork_shipments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "artwork_shipments_order_id_key" ON "artwork_shipments"("order_id");
CREATE INDEX IF NOT EXISTS "artwork_shipments_tracking_no_idx" ON "artwork_shipments"("tracking_no");
ALTER TABLE "artwork_shipments"
  ADD CONSTRAINT "artwork_shipments_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "artwork_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "artwork_order_issues" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "ArtworkIssueType" NOT NULL,
  "status" "ArtworkIssueStatus" NOT NULL DEFAULT 'OPEN',
  "message" TEXT NOT NULL,
  "image_url" TEXT,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artwork_order_issues_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "artwork_order_issues_order_id_status_idx" ON "artwork_order_issues"("order_id", "status");
CREATE INDEX IF NOT EXISTS "artwork_order_issues_user_id_created_at_idx" ON "artwork_order_issues"("user_id", "created_at");
ALTER TABLE "artwork_order_issues"
  ADD CONSTRAINT "artwork_order_issues_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "artwork_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artwork_order_issues"
  ADD CONSTRAINT "artwork_order_issues_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Payment source links for first-come-first-served programs and artwork orders.
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "program_application_id" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "artwork_order_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_program_application_id_key" ON "payments"("program_application_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_artwork_order_id_key" ON "payments"("artwork_order_id");
CREATE INDEX IF NOT EXISTS "payments_membership_id_fan_user_id_status_idx" ON "payments"("membership_id", "fan_user_id", "status");
CREATE INDEX IF NOT EXISTS "payments_program_application_id_status_idx" ON "payments"("program_application_id", "status");
CREATE INDEX IF NOT EXISTS "payments_artwork_order_id_status_idx" ON "payments"("artwork_order_id", "status");
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_program_application_id_fkey"
  FOREIGN KEY ("program_application_id") REFERENCES "program_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_artwork_order_id_fkey"
  FOREIGN KEY ("artwork_order_id") REFERENCES "artwork_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
