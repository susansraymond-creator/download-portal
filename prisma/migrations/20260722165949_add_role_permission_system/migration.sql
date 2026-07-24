-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('MANAGE_CONTENT', 'MANAGE_CATEGORIES', 'MANAGE_TAGS', 'MANAGE_USERS', 'MANAGE_COMMENTS', 'MANAGE_REPORTS', 'MANAGE_DOWNLOAD_LINKS', 'VIEW_ANALYTICS', 'MANAGE_SETTINGS', 'MANAGE_NOTIFICATIONS');

-- CreateEnum
CREATE TYPE "ContentAccessLevel" AS ENUM ('NORMAL', 'PREMIUM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'VISITOR';
ALTER TYPE "Role" ADD VALUE 'PREMIUM';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "accessLevel" "ContentAccessLevel" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "Permission" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminPermission_userId_idx" ON "AdminPermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_userId_permission_key" ON "AdminPermission"("userId", "permission");

-- CreateIndex
CREATE INDEX "Category_isHidden_idx" ON "Category"("isHidden");

-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
