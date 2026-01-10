-- CreateTable
CREATE TABLE "Telemetry" (
    "id" SERIAL NOT NULL,
    "droneId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION NOT NULL,
    "heading" DOUBLE PRECISION,
    "groundSpeed" DOUBLE PRECISION,
    "verticalSpeed" DOUBLE PRECISION,
    "batteryLevel" DOUBLE PRECISION,
    "voltage" DOUBLE PRECISION,
    "current" DOUBLE PRECISION,
    "gpsFixType" INTEGER,
    "satelliteCount" INTEGER,
    "flightMode" TEXT,
    "armed" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Telemetry_droneId_idx" ON "Telemetry"("droneId");

-- CreateIndex
CREATE INDEX "Telemetry_timestamp_idx" ON "Telemetry"("timestamp");
