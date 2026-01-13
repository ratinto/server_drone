-- CreateTable
CREATE TABLE "CoordinateLogs" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordinateLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoordinateLogs_timestamp_idx" ON "CoordinateLogs"("timestamp");

-- CreateIndex
CREATE INDEX "CoordinateLogs_createdAt_idx" ON "CoordinateLogs"("createdAt");
