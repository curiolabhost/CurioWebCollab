/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `AdminInvite` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AdminInvite_tokenHash_key";

-- AlterTable
ALTER TABLE "AdminInvite" DROP COLUMN "tokenHash",
ADD COLUMN     "replacesInviteId" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "AdminInvite_revokedAt_idx" ON "AdminInvite"("revokedAt");

-- AddForeignKey
ALTER TABLE "AdminInvite" ADD CONSTRAINT "AdminInvite_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
