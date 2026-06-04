export function shouldSendAlert({ latestPrice, ma20, ma60 }) {
  if (!Number.isFinite(latestPrice)) {
    throw new Error("latestPrice must be a number.");
  }

  if (!Number.isFinite(ma20)) {
    throw new Error("ma20 must be a number.");
  }

  if (!Number.isFinite(ma60)) {
    throw new Error("ma60 must be a number.");
  }

  return latestPrice < ma20 && latestPrice < ma60;
}
