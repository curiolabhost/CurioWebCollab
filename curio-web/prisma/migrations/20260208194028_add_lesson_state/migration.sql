-- CreateTable
CREATE TABLE "LessonState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectSlug" TEXT NOT NULL,
    "lessonSlug" TEXT NOT NULL,
    "blanks" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonState_userId_projectSlug_lessonSlug_idx" ON "LessonState"("userId", "projectSlug", "lessonSlug");

-- CreateIndex
CREATE UNIQUE INDEX "LessonState_userId_projectSlug_lessonSlug_key" ON "LessonState"("userId", "projectSlug", "lessonSlug");

-- AddForeignKey
ALTER TABLE "LessonState" ADD CONSTRAINT "LessonState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
