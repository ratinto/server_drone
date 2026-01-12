/*
  Warnings:

  - You are about to drop the `CoordinateLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Coordinates" ADD COLUMN     "altitude" DOUBLE PRECISION,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "CoordinateLog";

-- CreateIndex
CREATE INDEX "Coordinates_timestamp_idx" ON "Coordinates"("timestamp");
