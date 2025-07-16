-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "soldAt" TIMESTAMP(3);
