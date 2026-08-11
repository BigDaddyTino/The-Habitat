ALTER TABLE "UserXpEntry" ADD CONSTRAINT "UserXpEntry_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "WeeklyQuestDefinition" ADD CONSTRAINT "WeeklyQuestDefinition_threshold_positive" CHECK ("threshold" > 0);
ALTER TABLE "WeeklyQuestDefinition" ADD CONSTRAINT "WeeklyQuestDefinition_xpReward_positive" CHECK ("xpReward" > 0);
ALTER TABLE "WeeklyQuestCycle" ADD CONSTRAINT "WeeklyQuestCycle_valid_window" CHECK ("endsAt" > "weekStart");
ALTER TABLE "WeeklyQuestSelection" ADD CONSTRAINT "WeeklyQuestSelection_sortOrder_valid" CHECK ("sortOrder" >= 0 AND "sortOrder" < 16);
ALTER TABLE "UserWeeklyQuestProgress" ADD CONSTRAINT "UserWeeklyQuestProgress_nonnegative" CHECK ("progress" >= 0);
