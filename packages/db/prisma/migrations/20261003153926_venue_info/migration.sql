-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "bookingInfo" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "infoSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "infoUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "website" TEXT;
