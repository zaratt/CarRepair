-- CreateTable
CREATE TABLE "VehiclePhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
