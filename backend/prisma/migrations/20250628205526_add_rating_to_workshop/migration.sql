-- AlterTable
ALTER TABLE "Workshop" ADD COLUMN     "rating" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
