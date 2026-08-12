import assert from "node:assert/strict";
import test from "node:test";
import { parseRequestBudget, utcUsageDay } from "./provider-budget.js";

test("provider budgets use a stable UTC day and reject unsafe configuration", () => {
  assert.equal(utcUsageDay(new Date("2026-08-12T23:59:00-04:00")).toISOString(), "2026-08-13T00:00:00.000Z");
  assert.equal(parseRequestBudget("2500", 100), 2500);
  assert.equal(parseRequestBudget("0", 100), 100);
  assert.equal(parseRequestBudget("secret", 100), 100);
});
