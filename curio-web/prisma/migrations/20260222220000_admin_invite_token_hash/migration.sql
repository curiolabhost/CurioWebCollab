-- Add tokenHash for link-based invites (token in URL, hash stored for lookup)
ALTER TABLE "AdminInvite" ADD COLUMN "tokenHash" TEXT;

CREATE UNIQUE INDEX "AdminInvite_tokenHash_key" ON "AdminInvite"("tokenHash");
