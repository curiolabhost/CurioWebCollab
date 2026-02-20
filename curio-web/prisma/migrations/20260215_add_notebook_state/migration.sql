-- CreateTable
CREATE TABLE "NotebookState" (
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Notebook',
    "pagesJson" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotebookState_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "NotebookState" ADD CONSTRAINT "NotebookState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;