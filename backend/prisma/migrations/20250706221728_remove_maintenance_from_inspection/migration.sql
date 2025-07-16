/*
  Warnings:

  - You are about to drop the column `maintenanceId` on the `Inspection` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Inspection" DROP CONSTRAINT "Inspection_maintenanceId_fkey";

-- AlterTable
ALTER TABLE "Inspection" DROP COLUMN "maintenanceId";
