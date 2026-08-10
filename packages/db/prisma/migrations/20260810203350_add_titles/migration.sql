-- CreateEnum
CREATE TYPE "UserTitleSource" AS ENUM ('ADMIN', 'ACHIEVEMENT');

-- CreateTable
CREATE TABLE "TitleDefinition" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TitleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTitle" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "titleDefinitionId" UUID NOT NULL,
    "source" "UserTitleSource" NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "awardedByUserId" UUID,

    CONSTRAINT "UserTitle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TitleDefinition_slug_key" ON "TitleDefinition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TitleDefinition_name_key" ON "TitleDefinition"("name");

-- CreateIndex
CREATE INDEX "UserTitle_userId_equipped_idx" ON "UserTitle"("userId", "equipped");

-- CreateIndex
CREATE UNIQUE INDEX "UserTitle_userId_titleDefinitionId_key" ON "UserTitle"("userId", "titleDefinitionId");

-- AddForeignKey
ALTER TABLE "UserTitle" ADD CONSTRAINT "UserTitle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTitle" ADD CONSTRAINT "UserTitle_titleDefinitionId_fkey" FOREIGN KEY ("titleDefinitionId") REFERENCES "TitleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTitle" ADD CONSTRAINT "UserTitle_awardedByUserId_fkey" FOREIGN KEY ("awardedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
