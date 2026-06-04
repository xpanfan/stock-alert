import { shouldSendAlert } from "../alerts/shouldSendAlert.js";
import { sendLineMessage } from "../alerts/lineClient.js";
import { loadEnvFile } from "../config/env.js";
import { getEnabledWatchlist } from "../data/watchlist.js";
import { calculateMa20, calculateMa60 } from "../indicators/movingAverage.js";
import { fetchDailyPrices } from "../market/fetchPrices.js";

function formatPrice(value) {
  return Number(value).toFixed(2);
}

function formatPercent(value) {
  return `${Number(value).toFixed(2)}%`;
}

function getTaipeiTime() {
  return new Date().toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour12: false
  });
}

function buildAlertMessage({ stock, latestPrice, ma20, ma60, checkedAt }) {
  const belowMa20Percent = ((ma20 - latestPrice) / ma20) * 100;
  const belowMa60Percent = ((ma60 - latestPrice) / ma60) * 100;

  return [
    `賣出提醒：${stock.symbol} ${stock.name}`,
    `目前價格：${formatPrice(latestPrice)}`,
    `月線 MA20：${formatPrice(ma20)}`,
    `季線 MA60：${formatPrice(ma60)}`,
    `跌破月線幅度：${formatPercent(belowMa20Percent)}`,
    `跌破季線幅度：${formatPercent(belowMa60Percent)}`,
    "狀態：價格已同時跌破月線與季線",
    `檢查時間：${checkedAt}`
  ].join("\n");
}

async function notifyIfNeeded({ stock, latestPrice, ma20, ma60, checkedAt }) {
  if (!shouldSendAlert({ latestPrice, ma20, ma60 })) {
    return false;
  }

  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!accessToken || !userId) {
    console.log(`  Alert skipped: LINE settings are not configured.`);
    return true;
  }

  await sendLineMessage({
    accessToken,
    userId,
    text: buildAlertMessage({ stock, latestPrice, ma20, ma60, checkedAt })
  });

  console.log("  LINE alert sent.");
  return true;
}

async function checkStock(stock) {
  const marketData = await fetchDailyPrices(stock.symbol);
  const closingPrices = marketData.prices.map((row) => row.close);
  const latestPrice = marketData.latestPrice;
  const ma20 = calculateMa20(closingPrices);
  const ma60 = calculateMa60(closingPrices);
  const alertNeeded = shouldSendAlert({ latestPrice, ma20, ma60 });
  const checkedAt = getTaipeiTime();

  console.log(`${stock.symbol} ${stock.name}`);
  console.log(`  Latest: ${formatPrice(latestPrice)}`);
  console.log(`  MA20: ${formatPrice(ma20)}`);
  console.log(`  MA60: ${formatPrice(ma60)}`);
  console.log(`  Should alert: ${alertNeeded ? "YES" : "NO"}`);

  await notifyIfNeeded({ stock, latestPrice, ma20, ma60, checkedAt });

  return {
    symbol: stock.symbol,
    latestPrice,
    ma20,
    ma60,
    shouldAlert: alertNeeded
  };
}

async function main() {
  loadEnvFile();

  const stocks = await getEnabledWatchlist();
  const results = [];

  console.log(`Checking ${stocks.length} stocks...`);
  console.log("");

  for (const stock of stocks) {
    try {
      const result = await checkStock(stock);
      results.push(result);
    } catch (error) {
      console.error(`${stock.symbol} ${stock.name}`);
      console.error(`  Failed: ${error.message}`);
    }

    console.log("");
  }

  const alertCount = results.filter((result) => result.shouldAlert).length;

  console.log("Check completed.");
  console.log(`Succeeded: ${results.length}/${stocks.length}`);
  console.log(`Alerts: ${alertCount}`);
}

main().catch((error) => {
  console.error("Stock check failed.");
  console.error(error.message);
  process.exitCode = 1;
});
