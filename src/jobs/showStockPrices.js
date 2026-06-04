import { fetchDailyPrices } from "../market/fetchPrices.js";

function formatPrice(value) {
  return Number(value).toFixed(2);
}

function printRecentCloses(label, prices) {
  console.log(label);

  for (const row of prices) {
    console.log(`${row.date}: ${formatPrice(row.close)}`);
  }
}

async function main() {
  const symbol = process.argv[2];

  if (!symbol) {
    console.error("Please provide a stock symbol. Example: npm run price -- AAPL");
    process.exitCode = 1;
    return;
  }

  const result = await fetchDailyPrices(symbol);
  const last20 = result.prices.slice(-20);
  const last60 = result.prices.slice(-60);

  console.log(`Symbol: ${result.symbol}`);
  console.log(`Exchange: ${result.exchangeName ?? "unknown"}`);
  console.log(`Currency: ${result.currency ?? "unknown"}`);
  console.log(`Latest price: ${formatPrice(result.latestPrice)}`);
  console.log(`Trading days loaded: ${result.prices.length}`);
  console.log("");

  printRecentCloses("Recent 20 closing prices:", last20);
  console.log("");
  printRecentCloses("Recent 60 closing prices:", last60);
}

main().catch((error) => {
  console.error("Failed to fetch stock prices.");
  console.error(error.message);
  process.exitCode = 1;
});
