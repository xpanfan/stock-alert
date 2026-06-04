import http from "node:http";
import { loadEnvFile } from "../config/env.js";
import {
  getAllStocksFromSupabase,
  getLatestSnapshotsBySymbol,
  insertStock,
  isSupabaseConfigured
} from "../db/supabaseClient.js";

const host = "127.0.0.1";
const port = Number(process.env.ADMIN_PORT ?? 3000);

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(data));
}

function sendHtml(response, html) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(html);
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function validateStockInput(input) {
  const symbol = String(input.symbol ?? "").trim().toUpperCase();
  const name = String(input.name ?? "").trim();
  const market = String(input.market ?? "").trim().toUpperCase();
  const enabled = input.enabled !== false;

  if (!symbol) {
    throw new Error("股票代號必填。");
  }

  if (!name) {
    throw new Error("股票名稱必填。");
  }

  if (!["US", "TW"].includes(market)) {
    throw new Error("市場只能是 US 或 TW。");
  }

  return {
    symbol,
    name,
    market,
    enabled
  };
}

function getAdminHtml() {
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Stock Alert Admin</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f7f9;
        --panel: #ffffff;
        --text: #1f2933;
        --muted: #697586;
        --line: #d9dee7;
        --accent: #0f766e;
        --accent-dark: #115e59;
        --off: #8a94a6;
        --danger: #b42318;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: Arial, "Microsoft JhengHei", sans-serif;
      }

      header {
        border-bottom: 1px solid var(--line);
        background: var(--panel);
      }

      .wrap {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        min-height: 64px;
      }

      h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
      }

      button {
        min-height: 36px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--panel);
        color: var(--text);
        cursor: pointer;
        font: inherit;
        padding: 0 12px;
      }

      button:hover {
        border-color: var(--accent);
      }

      button.primary {
        border-color: var(--accent);
        background: var(--accent);
        color: #ffffff;
      }

      button.primary:hover {
        border-color: var(--accent-dark);
        background: var(--accent-dark);
      }

      main {
        padding: 24px 0;
      }

      .form-panel {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        margin-bottom: 18px;
        padding: 16px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1.4fr 120px 120px auto;
        gap: 12px;
        align-items: end;
      }

      label {
        display: grid;
        gap: 6px;
        color: #364152;
        font-size: 13px;
        font-weight: 700;
      }

      input,
      select {
        width: 100%;
        min-height: 38px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #ffffff;
        color: var(--text);
        font: inherit;
        padding: 0 10px;
      }

      .checkbox-label {
        align-items: center;
        display: flex;
        min-height: 38px;
        gap: 8px;
      }

      .checkbox-label input {
        width: 18px;
        min-height: 18px;
      }

      .summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 12px;
        color: var(--muted);
        font-size: 14px;
      }

      .error {
        color: var(--danger);
        font-weight: 700;
      }

      .success {
        color: var(--accent-dark);
        font-weight: 700;
      }

      .table-shell {
        overflow-x: auto;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
      }

      table {
        width: 100%;
        min-width: 980px;
        border-collapse: collapse;
      }

      th,
      td {
        border-bottom: 1px solid var(--line);
        padding: 12px 14px;
        text-align: left;
        vertical-align: middle;
        font-size: 14px;
      }

      th {
        background: #eef2f6;
        color: #364152;
        font-size: 13px;
        font-weight: 700;
      }

      tr:last-child td {
        border-bottom: 0;
      }

      .symbol {
        font-weight: 700;
      }

      .status {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        border-radius: 999px;
        padding: 0 10px;
        font-size: 13px;
        font-weight: 700;
      }

      .status.on {
        background: #d8f3ee;
        color: #0f5f59;
      }

      .status.off {
        background: #edf0f4;
        color: var(--off);
      }

      .number {
        font-variant-numeric: tabular-nums;
        text-align: right;
      }

      .below-price {
        color: var(--danger);
        font-weight: 700;
      }

      .muted {
        color: var(--muted);
      }

      .empty {
        padding: 32px 14px;
        color: var(--muted);
        text-align: center;
      }

      @media (max-width: 860px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="wrap topbar">
        <h1>Stock Alert Admin</h1>
        <button id="refreshButton" type="button">重新整理</button>
      </div>
    </header>
    <main class="wrap">
      <form id="addStockForm" class="form-panel">
        <div class="form-grid">
          <label>
            股票代號
            <input id="symbolInput" name="symbol" placeholder="例如 AAPL 或 0050.TW" autocomplete="off" required>
          </label>
          <label>
            股票名稱
            <input id="nameInput" name="name" placeholder="例如 Apple Inc." autocomplete="off" required>
          </label>
          <label>
            市場
            <select id="marketInput" name="market">
              <option value="US">US</option>
              <option value="TW">TW</option>
            </select>
          </label>
          <label class="checkbox-label">
            <input id="enabledInput" name="enabled" type="checkbox" checked>
            啟用
          </label>
          <button class="primary" type="submit">新增股票</button>
        </div>
      </form>
      <div class="summary">
        <div id="summaryText">載入中</div>
        <div id="updatedText"></div>
      </div>
      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>股票代號</th>
              <th>名稱</th>
              <th>市場</th>
              <th>狀態</th>
              <th>目前股價</th>
              <th>月均 MA20</th>
              <th>季均 MA60</th>
              <th>檢查時間</th>
            </tr>
          </thead>
          <tbody id="stocksBody">
            <tr><td class="empty" colspan="8">載入中</td></tr>
          </tbody>
        </table>
      </div>
    </main>
    <script>
      const summaryText = document.querySelector("#summaryText");
      const updatedText = document.querySelector("#updatedText");
      const stocksBody = document.querySelector("#stocksBody");
      const refreshButton = document.querySelector("#refreshButton");
      const addStockForm = document.querySelector("#addStockForm");
      const symbolInput = document.querySelector("#symbolInput");
      const nameInput = document.querySelector("#nameInput");
      const marketInput = document.querySelector("#marketInput");
      const enabledInput = document.querySelector("#enabledInput");

      function escapeHtml(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      function formatPrice(value) {
        if (value === null || value === undefined) {
          return "-";
        }

        return Number(value).toFixed(2);
      }

      function formatTime(value) {
        if (!value) {
          return "-";
        }

        return new Date(value).toLocaleString("zh-TW", { hour12: false });
      }

      function movingAverageCell(snapshot, key) {
        const value = snapshot?.[key];

        if (value === null || value === undefined) {
          return '<td class="number">-</td>';
        }

        const isBelow = Number(snapshot.latest_price) < Number(value);
        const className = isBelow ? "number below-price" : "number";

        return '<td class="' + className + '">' + formatPrice(value) + '</td>';
      }

      function renderStocks(stocks) {
        if (stocks.length === 0) {
          stocksBody.innerHTML = '<tr><td class="empty" colspan="8">沒有股票資料</td></tr>';
          return;
        }

        stocksBody.innerHTML = stocks.map((stock) => {
          const statusClass = stock.enabled ? "on" : "off";
          const statusText = stock.enabled ? "啟用" : "停用";

          return '<tr>' +
            '<td class="symbol">' + escapeHtml(stock.symbol) + '</td>' +
            '<td>' + escapeHtml(stock.name) + '</td>' +
            '<td>' + escapeHtml(stock.market) + '</td>' +
            '<td><span class="status ' + statusClass + '">' + statusText + '</span></td>' +
            '<td class="number">' + formatPrice(stock.latestSnapshot?.latest_price) + '</td>' +
            movingAverageCell(stock.latestSnapshot, "ma20") +
            movingAverageCell(stock.latestSnapshot, "ma60") +
            '<td class="muted">' + formatTime(stock.latestSnapshot?.checked_at) + '</td>' +
          '</tr>';
        }).join("");
      }

      async function loadStocks() {
        summaryText.textContent = "載入中";
        summaryText.className = "";

        try {
          const response = await fetch("/api/stocks");
          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.error || "讀取失敗");
          }

          renderStocks(payload.stocks);
          const enabledCount = payload.stocks.filter((stock) => stock.enabled).length;
          summaryText.textContent = "共 " + payload.stocks.length + " 檔，啟用 " + enabledCount + " 檔";
          updatedText.textContent = new Date().toLocaleString("zh-TW", { hour12: false });
        } catch (error) {
          summaryText.textContent = error.message;
          summaryText.className = "error";
          updatedText.textContent = "";
          stocksBody.innerHTML = '<tr><td class="empty" colspan="8">無法讀取資料</td></tr>';
        }
      }

      async function addStock(event) {
        event.preventDefault();
        summaryText.textContent = "新增中";
        summaryText.className = "";

        try {
          const response = await fetch("/api/stocks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              symbol: symbolInput.value,
              name: nameInput.value,
              market: marketInput.value,
              enabled: enabledInput.checked
            })
          });
          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.error || "新增失敗");
          }

          addStockForm.reset();
          enabledInput.checked = true;
          summaryText.textContent = "已新增 " + payload.stock.symbol;
          summaryText.className = "success";
          await loadStocks();
        } catch (error) {
          summaryText.textContent = error.message;
          summaryText.className = "error";
        }
      }

      refreshButton.addEventListener("click", loadStocks);
      addStockForm.addEventListener("submit", addStock);
      loadStocks();
    </script>
  </body>
</html>`;
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${host}:${port}`);

  if (request.method === "GET" && url.pathname === "/") {
    sendHtml(response, getAdminHtml());
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/stocks") {
    if (!isSupabaseConfigured()) {
      sendJson(response, 500, {
        error: "Supabase is not configured."
      });
      return;
    }

    const stocks = await getAllStocksFromSupabase();
    const latestSnapshotsBySymbol = await getLatestSnapshotsBySymbol();
    const stocksWithSnapshots = stocks.map((stock) => ({
      ...stock,
      latestSnapshot: latestSnapshotsBySymbol.get(stock.symbol) ?? null
    }));
    sendJson(response, 200, { stocks: stocksWithSnapshots });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/stocks") {
    if (!isSupabaseConfigured()) {
      sendJson(response, 500, {
        error: "Supabase is not configured."
      });
      return;
    }

    const input = validateStockInput(await readJsonBody(request));
    const stock = await insertStock(input);
    sendJson(response, 201, { stock });
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

loadEnvFile();

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, 500, {
      error: error.message
    });
  });
});

server.listen(port, host, () => {
  console.log(`Stock Alert Admin: http://${host}:${port}`);
});
