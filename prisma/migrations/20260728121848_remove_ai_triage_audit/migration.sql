/*
  Warnings:

  - You are about to drop the `AiTriageSuggestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AiTriageSuggestion" DROP CONSTRAINT "AiTriageSuggestion_issueId_fkey";

-- DropForeignKey
ALTER TABLE "AiTriageSuggestion" DROP CONSTRAINT "AiTriageSuggestion_requestedById_fkey";

-- DropTable
DROP TABLE "AiTriageSuggestion";
