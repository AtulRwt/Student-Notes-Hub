-- CreateTable
CREATE TABLE "NoteSummary" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoteSummary_noteId_idx" ON "NoteSummary"("noteId");

-- CreateIndex
CREATE INDEX "NoteSummary_userId_idx" ON "NoteSummary"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteSummary_noteId_userId_key" ON "NoteSummary"("noteId", "userId");

-- AddForeignKey
ALTER TABLE "NoteSummary" ADD CONSTRAINT "NoteSummary_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSummary" ADD CONSTRAINT "NoteSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
