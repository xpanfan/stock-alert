import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateMa20,
  calculateMa60,
  calculateSimpleMovingAverage
} from "../src/indicators/movingAverage.js";

describe("calculateSimpleMovingAverage", () => {
  it("calculates the average of the latest values in the selected period", () => {
    assert.equal(calculateSimpleMovingAverage([10, 20, 30, 40, 50], 3), 40);
  });

  it("throws when there are not enough values", () => {
    assert.throws(
      () => calculateSimpleMovingAverage([10, 20], 3),
      /At least 3 values are required/
    );
  });

  it("throws when a value is not a number", () => {
    assert.throws(
      () => calculateSimpleMovingAverage([10, Number.NaN, 30], 3),
      /values must only contain numbers/
    );
  });
});

describe("MA20 and MA60 helpers", () => {
  it("calculates MA20 from the latest 20 closing prices", () => {
    const prices = Array.from({ length: 20 }, (_, index) => index + 1);

    assert.equal(calculateMa20(prices), 10.5);
  });

  it("calculates MA60 from the latest 60 closing prices", () => {
    const prices = Array.from({ length: 60 }, (_, index) => index + 1);

    assert.equal(calculateMa60(prices), 30.5);
  });
});
