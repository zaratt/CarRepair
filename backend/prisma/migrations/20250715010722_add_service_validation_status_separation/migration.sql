/*
  Warnings:

  - You are about to drop the column `status` on the `Maintenance` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[validationCode]` on the table `Maintenance` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Maintenance" DROP COLUMN "status",
ADD COLUMN     "serviceStatus" TEXT NOT NULL DEFAULT 'concluido',
ADD COLUMN     "validationCode" TEXT,
ADD COLUMN     "validationStatus" TEXT NOT NULL DEFAULT 'registrado';

-- CreateIndex
CREATE UNIQUE INDEX "Maintenance_validationCode_key" ON "Maintenance"("validationCode");
