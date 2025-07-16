/*
  Warnings:

  - You are about to drop the column `model` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Vehicle` table. All the data in the column will be lost.
  - Added the required column `brandId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fuelType` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelYear` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'ETHANOL', 'FLEX', 'DIESEL', 'GNV', 'ELECTRIC', 'HYBRID', 'OTHER');

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "model",
DROP COLUMN "year",
ADD COLUMN     "brandId" TEXT NOT NULL,
ADD COLUMN     "fuelType" "FuelType" NOT NULL,
ADD COLUMN     "modelId" TEXT NOT NULL,
ADD COLUMN     "modelYear" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
