-- CreateTable
CREATE TABLE "AiTriageSuggestion" (
    "id" TEXT NOT NULL,
    "issueId" TEXT,
    "requestedById" TEXT,
    "description" TEXT NOT NULL,
    "suggestedPriority" "Priority" NOT NULL,
    "suggestedCategory" "Category" NOT NULL,
    "suggestedTitle" TEXT,
    "reasoning" TEXT,
    "finalPriority" "Priority",
    "finalCategory" "Category",
    "finalTitle" TEXT,
    "priorityMatched" BOOLEAN,
    "categoryMatched" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedAt" TIMESTAMP(3),

    CONSTRAINT "AiTriageSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiTriageSuggestion_issueId_key" ON "AiTriageSuggestion"("issueId");

-- CreateIndex
CREATE INDEX "AiTriageSuggestion_requestedById_idx" ON "AiTriageSuggestion"("requestedById");

-- AddForeignKey
ALTER TABLE "AiTriageSuggestion" ADD CONSTRAINT "AiTriageSuggestion_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTriageSuggestion" ADD CONSTRAINT "AiTriageSuggestion_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
