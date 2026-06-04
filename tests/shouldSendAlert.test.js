import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldSendAlert } from "../src/alerts/shouldSendAlert.js";

describe("shouldSendAlert", () => {
  it("returns true when latest price is below both MA20 and MA60", () => {
    assert.equal(
      shouldSendAlert({ latestPrice: 90, ma20: 100, ma60: 95 }),
      true
    );
  });

  it("returns false when latest price is only below MA20", () => {
    assert.equal(
      shouldSendAlert({ latestPrice: 94, ma20: 100, ma60: 90 }),
      false
    );
  });

  it("returns false when latest price is only below MA60", () => {
    assert.equal(
      shouldSendAlert({ latestPrice: 94, ma20: 90, ma60: 100 }),
      false
    );
  });

  it("returns false when latest price equals one of the moving averages", () => {
    assert.equal(
      shouldSendAlert({ latestPrice: 100, ma20: 100, ma60: 110 }),
      false
    );
  });

  it("throws when input is not numeric", () => {
    assert.throws(
      () => shouldSendAlert({ latestPrice: Number.NaN, ma20: 100, ma60: 100 }),
      /latestPrice must be a number/
    );
  });
});
