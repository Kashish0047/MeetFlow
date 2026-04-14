/*
  Warnings:

  - You are about to drop the column `userId` on the `Availability` table. All the data in the column will be lost.
  - Added the required column `scheduleId` to the `Availability` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_userId_fkey";

-- AlterTable
ALTER TABLE "Availability" DROP COLUMN "userId",
ADD COLUMN     "scheduleId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "answers" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'confirmed';

-- AlterTable
ALTER TABLE "EventType" ADD COLUMN     "bufferTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "questions" JSONB,
ADD COLUMN     "scheduleId" INTEGER;

-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Schedule',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateOverride" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "DateOverride_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateOverride" ADD CONSTRAINT "DateOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
