-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "isValidated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT;
