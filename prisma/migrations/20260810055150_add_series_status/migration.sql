-- CreateEnum
CREATE TYPE "SeriesStatus" AS ENUM ('ONGOING', 'COMPLETED');

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "seriesStatus" "SeriesStatus";
