-- CreateTable
CREATE TABLE "CircuitState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectSlug" TEXT NOT NULL,
    "lessonSlug" TEXT NOT NULL,
    "wokwiUrl" TEXT,
    "diagramJson" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircuitState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CircuitState_userId_projectSlug_lessonSlug_idx" ON "CircuitState"("userId", "projectSlug", "lessonSlug");

-- CreateIndex
CREATE UNIQUE INDEX "CircuitState_userId_projectSlug_lessonSlug_key" ON "CircuitState"("userId", "projectSlug", "lessonSlug");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircuitState" ADD CONSTRAINT "CircuitState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
