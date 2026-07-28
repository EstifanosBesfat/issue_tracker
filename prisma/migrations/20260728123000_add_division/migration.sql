-- CreateTable
CREATE TABLE "Division" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Division_name_key" ON "Division"("name");

-- Seed default divisions (matching the previous free-text department dropdown, plus a General fallback)
INSERT INTO "Division" ("id", "name", "isActive", "createdAt", "updatedAt") VALUES
  ('div_network',  'Network',          true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('div_it',       'IT',               true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('div_custsvc',  'Customer Service', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('div_finance',  'Finance',          true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('div_hr',       'HR',               true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('div_general',  'General',          true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: add the new divisionId column (nullable while we backfill)
ALTER TABLE "Issue" ADD COLUMN "divisionId" TEXT;

-- Backfill divisionId from the old free-text department column, case-insensitively
UPDATE "Issue" i
SET "divisionId" = d."id"
FROM "Division" d
WHERE lower(trim(i."department")) = lower(d."name");

-- Anything unmatched or null falls back to the "General" division
UPDATE "Issue"
SET "divisionId" = 'div_general'
WHERE "divisionId" IS NULL;

-- Now safe to drop the old free-text column
ALTER TABLE "Issue" DROP COLUMN "department";

-- CreateIndex
CREATE INDEX "Issue_divisionId_idx" ON "Issue"("divisionId");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
