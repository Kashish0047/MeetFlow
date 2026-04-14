/*
  Warnings:

  - Added the required column `scheduleId` to the `DateOverride` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DateOverride" ADD COLUMN     "scheduleId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "DateOverride" ADD CONSTRAINT "DateOverride_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
