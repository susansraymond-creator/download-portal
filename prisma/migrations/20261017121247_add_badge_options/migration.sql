-- CreateEnum
CREATE TYPE "BadgeKind" AS ENUM ('QUALITY', 'LANGUAGE');

-- CreateTable
CREATE TABLE "BadgeOption" (
    "id" TEXT NOT NULL,
    "kind" "BadgeKind" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BadgeOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BadgeOption_kind_idx" ON "BadgeOption"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeOption_kind_name_key" ON "BadgeOption"("kind", "name");
