-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tickets_shareToken_key" ON "tickets"("shareToken");
