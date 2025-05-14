-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rating" INTEGER,
    "category" TEXT,
    "emailTo" TEXT NOT NULL DEFAULT 'atulrajput5968@gmail.com',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
