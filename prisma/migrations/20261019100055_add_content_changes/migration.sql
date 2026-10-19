-- CreateTable
CREATE TABLE "ContentChange" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT,
    "requestedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "ContentChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentChange_status_createdAt_idx" ON "ContentChange"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentChange_contentId_idx" ON "ContentChange"("contentId");
