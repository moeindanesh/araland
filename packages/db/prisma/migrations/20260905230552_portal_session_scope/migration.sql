-- AlterTable
ALTER TABLE "OtpChallenge" ADD COLUMN     "siteScopeId" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "siteScopeId" TEXT;
