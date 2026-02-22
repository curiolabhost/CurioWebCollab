/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `AdminInvite` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AdminInvite" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvite_code_key" ON "AdminInvite"("code");
