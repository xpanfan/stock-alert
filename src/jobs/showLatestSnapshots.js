import { loadEnvFile } from "../config/env.js";
import { getLatestStockPriceSnapshots, isSupabaseConfigured } from "../db/supabaseClient.js";

function formatPrice(value) {
  return Number(value).toFixed(2);
}

function formatTaipeiTime(value) {
  return new Date(value).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour12: false
  });
}

async function main() {
  loadEnvFile();

  if (!isSupabaseConfigured()) {
    console.error("Supabase is not configured.");
    console.error("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.");
    process.exitCode = 1;
    return;
  }

  const snapshots = await getLatestStockPriceSnapshots({ limit: 10 });

  if (snapshots.length === 0) {
    console.log("No stock price snapshots found.");
    return;
  }

  console.log("Latest snapshots:");

  for (const snapshot of snapshots) {
    console.log(
      [
        formatTaipeiTime(snapshot.checked_at),
        snapshot.symbol,
        `price ${formatPrice(snapshot.latest_price)}`,
        `MA20 ${formatPrice(snapshot.ma20)}`,
        `MA60 ${formatPrice(snapshot.ma60)}`,
        `alert ${snapshot.should_alert ? "YES" : "NO"}`
      ].join(" | ")
    );
  }
}

main().catch((error) => {
  console.error("Failed to read latest snapshots.");
  console.error(error.message);
  process.exitCode = 1;
});
