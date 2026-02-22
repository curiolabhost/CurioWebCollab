-- CreateEnum
CREATE TYPE "AdminInviteType" AS ENUM ('EMAIL', 'CODE');

-- AlterTable
ALTER TABLE "AdminInvite" ADD COLUMN     "type" "AdminInviteType" NOT NULL DEFAULT 'EMAIL',
ALTER COLUMN "email" DROP NOT NULL;
