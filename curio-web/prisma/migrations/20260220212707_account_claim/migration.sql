/*
  Warnings:

  - A unique constraint covering the columns `[linkedClerkUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clerkEnv" TEXT,
ADD COLUMN     "linkedClerkUserId" TEXT;

-- CreateTable
CREATE TABLE "AccountClaim" (
    "id" TEXT NOT NULL,
    "legacyUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountClaim_legacyUserId_key" ON "AccountClaim"("legacyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountClaim_tokenHash_key" ON "AccountClaim"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountClaim_email_idx" ON "AccountClaim"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_linkedClerkUserId_key" ON "User"("linkedClerkUserId");

-- AddForeignKey
ALTER TABLE "AccountClaim" ADD CONSTRAINT "AccountClaim_legacyUserId_fkey" FOREIGN KEY ("legacyUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
