import { getEnabledWatchlist } from "../data/watchlist.js";

function formatStockRow(stock, index) {
  const note = stock.note ? ` - ${stock.note}` : "";
  return `${index + 1}. ${stock.symbol} | ${stock.name} | ${stock.market}${note}`;
}

async function main() {
  const stocks = await getEnabledWatchlist();

  console.log(`Enabled watchlist: ${stocks.length} stocks`);

  for (const [index, stock] of stocks.entries()) {
    console.log(formatStockRow(stock, index));
  }
}

main().catch((error) => {
  console.error("Failed to read watchlist.");
  console.error(error.message);
  process.exitCode = 1;
});
