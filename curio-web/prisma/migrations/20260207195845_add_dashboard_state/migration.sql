-- DropForeignKey
ALTER TABLE "LessonProgress" DROP CONSTRAINT "LessonProgress_userId_fkey";

-- CreateTable
CREATE TABLE "ActiveLesson" (
    "userId" TEXT NOT NULL,
    "projectSlug" TEXT NOT NULL,
    "lessonSlug" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveLesson_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "LessonLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectSlug" TEXT NOT NULL,
    "lessonSlug" TEXT NOT NULL,
    "lessonIndex" INTEGER NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectSlug" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectStart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectSlug" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalStepsAtCompletion" INTEGER,

    CONSTRAINT "ProjectCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectSlug" TEXT NOT NULL,
    "daysPerWeek" INTEGER NOT NULL DEFAULT 3,
    "hoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActiveLesson_userId_updatedAt_idx" ON "ActiveLesson"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "LessonLocation_userId_projectSlug_idx" ON "LessonLocation"("userId", "projectSlug");

-- CreateIndex
CREATE UNIQUE INDEX "LessonLocation_userId_projectSlug_lessonSlug_key" ON "LessonLocation"("userId", "projectSlug", "lessonSlug");

-- CreateIndex
CREATE INDEX "ProjectStart_userId_startedAt_idx" ON "ProjectStart"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStart_userId_projectSlug_key" ON "ProjectStart"("userId", "projectSlug");

-- CreateIndex
CREATE INDEX "ProjectCompletion_userId_completedAt_idx" ON "ProjectCompletion"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCompletion_userId_projectSlug_key" ON "ProjectCompletion"("userId", "projectSlug");

-- CreateIndex
CREATE INDEX "ProjectSchedule_userId_projectSlug_idx" ON "ProjectSchedule"("userId", "projectSlug");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSchedule_userId_projectSlug_key" ON "ProjectSchedule"("userId", "projectSlug");

-- CreateIndex
CREATE INDEX "LessonProgress_userId_projectSlug_lessonSlug_idx" ON "LessonProgress"("userId", "projectSlug", "lessonSlug");

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveLesson" ADD CONSTRAINT "ActiveLesson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonLocation" ADD CONSTRAINT "LessonLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStart" ADD CONSTRAINT "ProjectStart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCompletion" ADD CONSTRAINT "ProjectCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSchedule" ADD CONSTRAINT "ProjectSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
