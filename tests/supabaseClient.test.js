import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getStartOfTaipeiDayUtc } from "../src/db/supabaseClient.js";

describe("getStartOfTaipeiDayUtc", () => {
  it("returns UTC time for the start of the Taipei calendar day", () => {
    const result = getStartOfTaipeiDayUtc(new Date("2026-06-04T10:30:00.000Z"));

    assert.equal(result.toISOString(), "2026-06-03T16:00:00.000Z");
  });
});
