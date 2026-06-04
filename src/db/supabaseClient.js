const ALERT_TYPE_BELOW_MA20_MA60 = "BELOW_MA20_MA60";

export function getStartOfTaipeiDayUtc(now = new Date()) {
  const taipeiParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const year = Number(taipeiParts.find((part) => part.type === "year").value);
  const month = Number(taipeiParts.find((part) => part.type === "month").value);
  const day = Number(taipeiParts.find((part) => part.type === "day").value);

  return new Date(Date.UTC(year, month - 1, day) - 8 * 60 * 60 * 1000);
}

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseSettings() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing required environment variable: SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    restUrl: `${supabaseUrl.replace(/\/$/, "")}/rest/v1`,
    serviceRoleKey
  };
}

async function supabaseRequest(path, { method = "GET", query, body, prefer } = {}) {
  const { restUrl, serviceRoleKey } = getSupabaseSettings();
  const url = new URL(`${restUrl}/${path}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value);
  }

  const headers = {
    "apikey": serviceRoleKey,
    "Authorization": `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json"
  };

  if (prefer) {
    headers.Prefer = prefer;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function getEnabledStocksFromSupabase() {
  return supabaseRequest("stocks", {
    query: {
      select: "id,symbol,name,market,enabled,note",
      enabled: "eq.true",
      order: "symbol.asc"
    }
  });
}

export async function getAllStocksFromSupabase() {
  return supabaseRequest("stocks", {
    query: {
      select: "id,symbol,name,market,enabled,note,created_at,updated_at",
      order: "symbol.asc"
    }
  });
}

export async function insertStock({
  symbol,
  name,
  market,
  enabled = true
}) {
  const rows = await supabaseRequest("stocks", {
    method: "POST",
    prefer: "return=representation",
    body: {
      symbol,
      name,
      market,
      enabled,
      note: ""
    }
  });

  return rows?.[0] ?? null;
}

export async function insertStockPriceSnapshot({
  stock,
  latestPrice,
  ma20,
  ma60,
  shouldAlert,
  checkedAtIso
}) {
  const rows = await supabaseRequest("stock_price_snapshots", {
    method: "POST",
    prefer: "return=representation",
    body: {
      stock_id: stock.id ?? null,
      symbol: stock.symbol,
      latest_price: latestPrice,
      ma20,
      ma60,
      is_below_ma20: latestPrice < ma20,
      is_below_ma60: latestPrice < ma60,
      should_alert: shouldAlert,
      checked_at: checkedAtIso
    }
  });

  return rows?.[0] ?? null;
}

export async function getLatestStockPriceSnapshots({ limit = 10 } = {}) {
  return supabaseRequest("stock_price_snapshots", {
    query: {
      select: "symbol,latest_price,ma20,ma60,should_alert,checked_at",
      order: "checked_at.desc",
      limit: String(limit)
    }
  });
}

export async function getLatestSnapshotsBySymbol({ limit = 200 } = {}) {
  const snapshots = await supabaseRequest("stock_price_snapshots", {
    query: {
      select: "symbol,latest_price,ma20,ma60,should_alert,checked_at",
      order: "checked_at.desc",
      limit: String(limit)
    }
  });

  const latestBySymbol = new Map();

  for (const snapshot of snapshots) {
    if (!latestBySymbol.has(snapshot.symbol)) {
      latestBySymbol.set(snapshot.symbol, snapshot);
    }
  }

  return latestBySymbol;
}

export async function hasAlertLogToday({ symbol, alertType = ALERT_TYPE_BELOW_MA20_MA60, now = new Date() }) {
  const startOfTaipeiDayUtc = getStartOfTaipeiDayUtc(now);

  const rows = await supabaseRequest("alert_logs", {
    query: {
      select: "id",
      symbol: `eq.${symbol}`,
      alert_type: `eq.${alertType}`,
      sent_at: `gte.${startOfTaipeiDayUtc.toISOString()}`,
      limit: "1"
    }
  });

  return rows.length > 0;
}

export async function insertAlertLog({
  stock,
  message,
  alertType = ALERT_TYPE_BELOW_MA20_MA60,
  sentAtIso
}) {
  const rows = await supabaseRequest("alert_logs", {
    method: "POST",
    prefer: "return=representation",
    body: {
      stock_id: stock.id ?? null,
      symbol: stock.symbol,
      alert_type: alertType,
      message,
      sent_at: sentAtIso
    }
  });

  return rows?.[0] ?? null;
}

export { ALERT_TYPE_BELOW_MA20_MA60 };
