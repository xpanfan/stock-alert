const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

function buildChartUrl(symbol) {
  const url = new URL(`${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}`);
  url.searchParams.set("range", "6mo");
  url.searchParams.set("interval", "1d");
  return url;
}

function toDailyPriceRows(timestamps, quote) {
  return timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      open: quote.open[index],
      high: quote.high[index],
      low: quote.low[index],
      close: quote.close[index],
      volume: quote.volume[index]
    }))
    .filter((row) => Number.isFinite(row.close));
}

export async function fetchDailyPrices(symbol) {
  if (!symbol) {
    throw new Error("Stock symbol is required.");
  }

  const response = await fetch(buildChartUrl(symbol));

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed: ${response.status}`);
  }

  const payload = await response.json();
  const chart = payload.chart;

  if (chart.error) {
    throw new Error(chart.error.description || "Yahoo Finance returned an error.");
  }

  const result = chart.result?.[0];
  const timestamps = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];

  if (!timestamps || !quote) {
    throw new Error(`No daily price data found for ${symbol}.`);
  }

  const prices = toDailyPriceRows(timestamps, quote);

  if (prices.length < 60) {
    throw new Error(`Only ${prices.length} trading days found for ${symbol}; at least 60 are required.`);
  }

  return {
    symbol,
    currency: result.meta?.currency,
    exchangeName: result.meta?.exchangeName,
    latestPrice: result.meta?.regularMarketPrice ?? prices.at(-1).close,
    prices
  };
}
