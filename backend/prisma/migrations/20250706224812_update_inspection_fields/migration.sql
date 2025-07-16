/*
  Warnings:

  - Added the required column `company` to the `Inspection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Inspection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Inspection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Inspection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleId` to the `Inspection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "company" TEXT NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vehicleId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "InspectionAttachment" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionAttachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionAttachment" ADD CONSTRAINT "InspectionAttachment_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
