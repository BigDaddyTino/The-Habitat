CREATE UNIQUE INDEX "UserTitle_one_equipped_per_user" ON "UserTitle"("userId") WHERE "equipped" = true;
