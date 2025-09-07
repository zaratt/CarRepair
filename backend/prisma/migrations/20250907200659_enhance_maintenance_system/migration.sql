/*
  Warnings:

  - Added the required column `updatedAt` to the `Maintenance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `MaintenanceAttachment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."MaintenanceAttachment" DROP CONSTRAINT "MaintenanceAttachment_maintenanceId_fkey";

-- AlterTable
ALTER TABLE "public"."Maintenance" ADD COLUMN     "services" TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workshopAddress" TEXT,
ADD COLUMN     "workshopCnpj" TEXT,
ADD COLUMN     "workshopName" TEXT,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "products" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."MaintenanceAttachment" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "size" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceAttachment" ADD CONSTRAINT "MaintenanceAttachment_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "public"."Maintenance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
