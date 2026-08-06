-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('MUST_WATCH', 'GOOD', 'AVERAGE');

-- CreateTable
CREATE TABLE "ContentVote" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "voteType" "VoteType" NOT NULL,
    "voterKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentVote_contentId_idx" ON "ContentVote"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVote_contentId_voterKey_key" ON "ContentVote"("contentId", "voterKey");

-- AddForeignKey
ALTER TABLE "ContentVote" ADD CONSTRAINT "ContentVote_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
