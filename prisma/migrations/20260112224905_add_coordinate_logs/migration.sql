-- CreateTable
CREATE TABLE "CoordinateLog" (
    "id" SERIAL NOT NULL,
    "coordinateId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "droneId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordinateLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoordinateLog_coordinateId_idx" ON "CoordinateLog"("coordinateId");

-- CreateIndex
CREATE INDEX "CoordinateLog_droneId_idx" ON "CoordinateLog"("droneId");

-- CreateIndex
CREATE INDEX "CoordinateLog_timestamp_idx" ON "CoordinateLog"("timestamp");

-- CreateIndex
CREATE INDEX "CoordinateLog_action_idx" ON "CoordinateLog"("action");
