export function calculateSimpleMovingAverage(values, period) {
  if (!Array.isArray(values)) {
    throw new Error("values must be an array.");
  }

  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("period must be a positive integer.");
  }

  if (values.length < period) {
    throw new Error(`At least ${period} values are required.`);
  }

  const recentValues = values.slice(-period);
  const total = recentValues.reduce((sum, value) => {
    if (!Number.isFinite(value)) {
      throw new Error("values must only contain numbers.");
    }

    return sum + value;
  }, 0);

  return total / period;
}

export function calculateMa20(values) {
  return calculateSimpleMovingAverage(values, 20);
}

export function calculateMa60(values) {
  return calculateSimpleMovingAverage(values, 60);
}
