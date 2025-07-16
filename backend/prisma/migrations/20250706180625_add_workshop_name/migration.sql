/*
  Warnings:

  - Added the required column `name` to the `Workshop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Workshop" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MaintenanceAttachment" (
    "id" TEXT NOT NULL,
    "maintenanceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceAttachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MaintenanceAttachment" ADD CONSTRAINT "MaintenanceAttachment_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "Maintenance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
