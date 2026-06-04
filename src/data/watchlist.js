import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const watchlistPath = path.resolve(__dirname, "../../data/watchlist.json");

export async function getWatchlist() {
  const fileContent = await readFile(watchlistPath, "utf8");
  const watchlist = JSON.parse(fileContent);

  if (!Array.isArray(watchlist)) {
    throw new Error("data/watchlist.json must contain an array of stocks.");
  }

  return watchlist;
}

export async function getEnabledWatchlist() {
  const watchlist = await getWatchlist();
  return watchlist.filter((stock) => stock.enabled === true);
}
