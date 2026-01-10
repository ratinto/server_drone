-- CreateTable
CREATE TABLE "DroneCommand" (
    "id" SERIAL NOT NULL,
    "droneId" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "parameters" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "DroneCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DroneCommand_droneId_idx" ON "DroneCommand"("droneId");

-- CreateIndex
CREATE INDEX "DroneCommand_status_idx" ON "DroneCommand"("status");

-- CreateIndex
CREATE INDEX "DroneCommand_createdAt_idx" ON "DroneCommand"("createdAt");
