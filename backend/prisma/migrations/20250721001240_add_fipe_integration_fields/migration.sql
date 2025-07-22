-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_brandId_fkey";

-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_modelId_fkey";

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "fipeBrandId" INTEGER,
ADD COLUMN     "fipeModelId" INTEGER,
ADD COLUMN     "fipeTypeId" INTEGER,
ADD COLUMN     "fipeYearCode" TEXT,
ALTER COLUMN "brandId" DROP NOT NULL,
ALTER COLUMN "modelId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE SET NULL ON UPDATE CASCADE;
