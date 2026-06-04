# Stock Alert PRD

## 1. 產品概述

建立一個個股與 ETF 的投資提醒小工具，用來追蹤使用者指定的股票清單，並根據每日價格與月線、季線判斷是否需要賣出提醒。

系統每 30 分鐘自動檢查一次。如果某檔股票或 ETF 的最新價格同時低於月線與季線，系統會透過 LINE 傳送提醒給使用者。

本工具的第一版目標不是做完整交易系統，而是做一個簡單、穩定、可維護的「跌破均線提醒器」。

## 2. 目標使用者

- 主要使用者：需要追蹤多檔股票或 ETF 的個人投資者。
- 使用情境：使用者已經有自己的持股清單，希望系統自動檢查是否跌破重要均線。
- 技術背景：使用者不一定會寫程式，因此後台管理介面需要簡單清楚。

## 3. 核心問題

投資者如果手動檢查多檔股票，容易漏看跌破均線的情況。此工具要自動完成以下工作：

- 儲存要追蹤的股票與 ETF。
- 定期取得最新價格。
- 計算或取得月線與季線。
- 判斷是否跌破月線與季線。
- 透過 LINE 即時提醒。

## 4. 第一版功能範圍

### 4.1 股票與 ETF 清單管理

使用者可以建立一份追蹤清單。

每筆資料至少包含：

- 股票代號，例如 `AAPL`、`MSFT`、`VOO`、`0050.TW`。
- 股票名稱，例如 `Apple Inc.`。
- 市場類型，例如 `US`、`TW`。
- 是否啟用追蹤。
- 備註，例如買進原因或持股狀態。

第一版可以先用資料庫或設定檔管理股票清單，不一定要先做完整後台頁面。

### 4.2 價格資料取得

系統需要定期取得每檔股票或 ETF 的最新價格與歷史日 K 資料。

第一版建議資料來源：

- 美股與 ETF：Yahoo Finance API 套件或其他穩定市場資料 API。
- 台股：可先支援 Yahoo Finance 的台股代號格式，例如 `2330.TW`、`0050.TW`。

注意事項：

- 股票資料來源要集中封裝在單一模組，方便未來更換 API。
- 若 API 失敗，系統要記錄錯誤，不應讓整個排程中斷。
- 第一版不需要即時 tick 資料，使用接近即時或延遲報價即可。

### 4.3 月線與季線定義

第一版採用常見移動平均線定義：

- 月線：20 日簡單移動平均線，簡稱 `MA20`。
- 季線：60 日簡單移動平均線，簡稱 `MA60`。

計算方式：

- `MA20` = 最近 20 個交易日收盤價平均。
- `MA60` = 最近 60 個交易日收盤價平均。

判斷價格建議：

- 美股盤中：使用最新價格。
- 非交易時間：使用最近收盤價。
- 台股盤中：若資料來源可取得盤中價格，使用最新價格；否則使用最近收盤價。

### 4.4 賣出提醒條件

第一版只做一個明確規則：

當最新價格同時低於月線與季線時，發送 LINE 提醒。

條件：

```text
latestPrice < MA20 且 latestPrice < MA60
```

提醒內容需包含：

- 股票代號。
- 股票名稱。
- 最新價格。
- 月線 MA20。
- 季線 MA60。
- 跌破幅度。
- 檢查時間。

LINE 訊息範例：

```text
賣出提醒：AAPL Apple Inc.
目前價格：185.20
月線 MA20：190.35
季線 MA60：188.70
狀態：價格已同時跌破月線與季線
檢查時間：2026-06-04 14:30
```

### 4.5 重複通知控制

為避免每 30 分鐘重複發送同一檔股票提醒，系統需要通知冷卻機制。

第一版規則：

- 同一檔股票在同一天內，只針對同一個跌破狀態通知一次。
- 如果價格重新站回月線或季線之上，狀態重置。
- 狀態重置後再次跌破，可以再次通知。

### 4.6 LINE 通知

第一版使用 LINE Messaging API 或 LINE Notify 替代方案。

注意：

- 若 LINE Notify 已不可用，改用 LINE Messaging API。
- LINE Channel Token、User ID 等敏感資訊必須放在環境變數，不可寫死在程式碼。

需要的環境變數：

```text
LINE_CHANNEL_ACCESS_TOKEN=
LINE_USER_ID=
```

### 4.7 自動排程

系統每 30 分鐘檢查一次。

建議第一版部署方式：

- Vercel Cron Job：適合 Next.js 專案。
- GitHub Actions 排程：適合簡單腳本。
- Supabase Edge Functions + Cron：適合已經使用 Supabase。

第一版建議優先選擇：

```text
GitHub Actions scheduled workflow
```

原因：

- 開發成本低。
- 不需要自己維護伺服器。
- 適合每 30 分鐘執行一次的背景檢查任務。

## 5. 非第一版功能

以下功能先不做，避免第一版過度複雜：

- 自動下單。
- 多使用者帳號系統。
- 複雜技術指標，例如 MACD、RSI、布林通道。
- 回測系統。
- 手機 App。
- 即時分 K 線圖。
- 訂閱收費。

## 6. 建議技術棧

第一版以簡單、穩定、AI 容易生成為優先。

建議方案：

- 語言：JavaScript 或 TypeScript。
- 執行環境：Node.js。
- 股票資料：Yahoo Finance 套件或正式市場資料 API。
- 資料庫：Supabase Postgres。
- 通知：LINE Messaging API。
- 排程：GitHub Actions 或 Vercel Cron。
- 前端管理頁：Next.js + React + Tailwind CSS。

如果只做最小可用版，可以先不做前端頁面，直接用資料庫或 JSON 檔管理股票清單。

## 7. 建議資料表設計

### 7.1 stocks

用來儲存追蹤股票清單。

欄位：

- `id`: 唯一 ID。
- `symbol`: 股票代號，例如 `AAPL`。
- `name`: 股票名稱。
- `market`: 市場，例如 `US`、`TW`。
- `enabled`: 是否啟用追蹤。
- `note`: 備註。
- `created_at`: 建立時間。
- `updated_at`: 更新時間。

### 7.2 stock_price_snapshots

用來記錄每次檢查的價格與均線。

欄位：

- `id`: 唯一 ID。
- `stock_id`: 對應 `stocks.id`。
- `symbol`: 股票代號。
- `latest_price`: 最新價格。
- `ma20`: 月線。
- `ma60`: 季線。
- `is_below_ma20`: 是否低於月線。
- `is_below_ma60`: 是否低於季線。
- `should_alert`: 是否符合提醒條件。
- `checked_at`: 檢查時間。

### 7.3 alert_logs

用來記錄已發送通知，避免重複提醒。

欄位：

- `id`: 唯一 ID。
- `stock_id`: 對應 `stocks.id`。
- `symbol`: 股票代號。
- `alert_type`: 提醒類型，例如 `BELOW_MA20_MA60`。
- `message`: 發送內容。
- `sent_at`: 發送時間。

## 8. 核心流程

每 30 分鐘執行一次：

1. 讀取所有 `enabled = true` 的股票。
2. 對每檔股票取得最近至少 60 個交易日的價格資料。
3. 計算 `MA20` 與 `MA60`。
4. 取得最新價格。
5. 判斷是否同時低於 `MA20` 與 `MA60`。
6. 儲存本次檢查紀錄。
7. 檢查今天是否已經針對同一狀態發送過通知。
8. 如果尚未通知，透過 LINE 發送提醒。
9. 寫入通知紀錄。

## 9. 錯誤處理

系統需要處理以下錯誤：

- 股票代號不存在。
- 股票資料 API 失敗。
- 歷史資料不足 60 個交易日。
- LINE 發送失敗。
- 資料庫連線失敗。

錯誤處理原則：

- 單一股票失敗時，不影響其他股票檢查。
- 每次排程執行要輸出清楚 log。
- 嚴重錯誤要能在 GitHub Actions 或部署平台看到。

## 10. 安全與環境變數

不得把 API key 或 LINE token 寫死在程式碼。

需要的環境變數：

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_USER_ID=
MARKET_DATA_API_KEY=
```

如果第一版使用不需要 API key 的資料來源，`MARKET_DATA_API_KEY` 可以先不用。

## 11. 最小可用版本開發切片

### Step 1：建立專案與基本資料結構

目標：

- 建立 `stock_alert` 專案資料夾。
- 建立 Node.js 專案。
- 建立股票清單資料格式。

驗收標準：

- 可以用一個指令讀出股票清單。

### Step 2：取得單一股票價格

目標：

- 輸入一個股票代號。
- 取得最近至少 60 個交易日資料。

驗收標準：

- 終端機能顯示最新價格、最近 20 日收盤價、最近 60 日收盤價。

### Step 3：計算 MA20 與 MA60

目標：

- 寫出獨立的均線計算函式。

驗收標準：

- 給定一組價格陣列，可以正確算出 MA20 與 MA60。
- 至少有簡單測試資料驗證結果。

### Step 4：判斷是否需要提醒

目標：

- 建立判斷函式。

規則：

```text
latestPrice < MA20 且 latestPrice < MA60
```

驗收標準：

- 價格同時低於兩條線時回傳 `true`。
- 價格未同時低於兩條線時回傳 `false`。

### Step 5：LINE 發送測試

目標：

- 建立 LINE 訊息發送函式。

驗收標準：

- 執行測試指令後，使用者的 LINE 可以收到一則測試訊息。

### Step 6：整合批次檢查

目標：

- 對股票清單中的所有股票執行檢查。

驗收標準：

- 每檔股票都會輸出目前價格、MA20、MA60、是否提醒。
- 符合條件的股票會發送 LINE。

### Step 7：加入排程

目標：

- 每 30 分鐘自動執行一次。

驗收標準：

- GitHub Actions 或部署平台可以自動執行。
- 執行紀錄可以查詢。

### Step 8：加入資料庫

目標：

- 改用 Supabase 儲存股票清單、檢查紀錄與通知紀錄。

驗收標準：

- 股票清單可從 Supabase 讀取。
- 每次檢查結果會寫入資料庫。
- 同一天同一狀態不重複通知。

### Step 9：建立簡單管理頁

目標：

- 用網頁新增、編輯、停用股票。

驗收標準：

- 使用者可以在網頁管理追蹤清單。
- 不需要手動改 JSON 或資料庫。

## 12. AI 開發指示

請 AI 開發時遵守以下規則：

- 每次只開發一個最小功能，不要一次產出整套系統。
- 每個檔案都要明確說明路徑與檔名。
- 優先產出可執行、可測試的小功能。
- 先用假資料或 JSON 驗證流程，再接正式資料庫。
- 股票資料取得、均線計算、提醒判斷、LINE 發送要拆成不同模組。
- 所有 API token 都必須使用環境變數。
- 每完成一個步驟，都要提供測試指令。

## 13. 第一版建議檔案結構

```text
stock_alert/
  stock_prd.md
  package.json
  .env.example
  data/
    watchlist.json
  src/
    config/
      env.js
    data/
      watchlist.js
    market/
      fetchPrices.js
    indicators/
      movingAverage.js
    alerts/
      shouldSendAlert.js
      lineClient.js
    jobs/
      checkStocks.js
  tests/
    movingAverage.test.js
    shouldSendAlert.test.js
```

## 14. 成功指標

第一版完成時，應達成：

- 可以追蹤至少 20 檔股票或 ETF。
- 每 30 分鐘自動檢查。
- 符合條件時可收到 LINE 訊息。
- 不會在同一天對同一檔股票重複發送同一狀態提醒。
- 即使單一股票資料抓取失敗，其他股票仍可正常檢查。

## 15. 重要限制與提醒

- 本工具只提供提醒，不提供投資建議。
- 提醒訊號不保證獲利或避免虧損。
- 股票資料可能延遲或錯誤，正式使用前需要確認資料來源可靠性。
- 如果未來要接近即時交易決策，應改用付費且有 SLA 的市場資料 API。

## 16. 開發進度紀錄

### 2026-06-04：Step 1 已完成

完成內容：

- 建立 Node.js 專案基本設定。
- 建立 JSON 股票追蹤清單。
- 建立讀取啟用股票清單的資料模組。
- 建立終端機指令，確認可以讀出股票清單。

新增或修改檔案：

- `package.json`
- `.env.example`
- `data/watchlist.json`
- `src/data/watchlist.js`
- `src/jobs/listWatchlist.js`
- `scripts/list-watchlist.ps1`

測試指令：

```powershell
npm run list:watchlist
```

如果 PowerShell 暫時無法使用 npm，也可以執行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\list-watchlist.ps1
```

### 2026-06-04：Step 2 已完成

完成內容：

- 建立 Yahoo Finance 日線資料取得模組。
- 可以輸入單一股票代號。
- 可以取得最近至少 60 個交易日資料。
- 終端機會顯示最新價格、最近 20 日收盤價、最近 60 日收盤價。

新增或修改檔案：

- `package.json`
- `src/market/fetchPrices.js`
- `src/jobs/showStockPrices.js`

測試指令：

```powershell
npm run price -- AAPL
```

也可以測試台股 Yahoo Finance 代號格式：

```powershell
npm run price -- 0050.TW
```

### 2026-06-04：Step 3 已完成

完成內容：

- 建立獨立的簡單移動平均線計算函式。
- 建立 `MA20` 與 `MA60` 輔助函式。
- 建立 Node.js 內建測試，不需要額外安裝測試套件。
- 測試涵蓋正常計算、資料不足、非數字資料錯誤。

新增或修改檔案：

- `package.json`
- `src/indicators/movingAverage.js`
- `tests/movingAverage.test.js`

測試指令：

```powershell
npm run test:ma
```

執行全部測試：

```powershell
npm test
```

目前驗證結果：

```text
tests 5
pass 5
fail 0
```

### 2026-06-04：股票清單已更新

使用者提供的股票清單：

```text
中鼎
宏基
0050
德昌
PLTR
Goog
```

目前整理成 Yahoo Finance 可查詢格式：

```text
9933.TW  中鼎
2353.TW  宏碁
0050.TW  元大台灣50
5511.TWO 德昌
PLTR     Palantir Technologies Inc.
GOOG     Alphabet Inc.
```

注意事項：

- 使用者輸入「宏基」，目前先判定為台股「宏碁」，代號 `2353.TW`。
- 台股在 Yahoo Finance 查詢時需要加上 `.TW`，例如 `0050.TW`。
- 上櫃股票在 Yahoo Finance 可能需要加上 `.TWO`，例如德昌使用 `5511.TWO`。
- 股票清單檔案位置：`data/watchlist.json`

確認清單指令：

```powershell
npm run list:watchlist
```

### 2026-06-04：Step 4 已完成

完成內容：

- 建立獨立的提醒判斷函式。
- 規則為 `latestPrice < MA20` 且 `latestPrice < MA60`。
- 當價格只低於其中一條均線時，不發送提醒。
- 當價格等於均線時，不視為跌破。
- 建立 Node.js 內建測試，不需要額外安裝測試套件。

新增或修改檔案：

- `package.json`
- `src/alerts/shouldSendAlert.js`
- `tests/shouldSendAlert.test.js`
- `data/watchlist.json`

測試指令：

```powershell
npm run test:alert
```

執行全部測試：

```powershell
npm test
```

目前驗證結果：

```text
tests 10
pass 10
fail 0
```

### 2026-06-04：Step 5 已完成程式與本機測試

完成內容：

- 建立 LINE Messaging API 發送模組。
- 建立 LINE 測試訊息指令。
- 建立 `.env` 讀取工具，方便在本機保存 LINE 設定。
- 建立 `.gitignore`，避免 `.env` 被誤上傳。
- 建立 LINE 模組測試，測試不會真的發送 LINE，只驗證請求格式與錯誤處理。

新增或修改檔案：

- `package.json`
- `.gitignore`
- `src/config/env.js`
- `src/alerts/lineClient.js`
- `src/jobs/sendLineTest.js`
- `tests/lineClient.test.js`

先執行不發送真實 LINE 的程式測試：

```powershell
npm run test:line
```

執行全部測試：

```powershell
npm test
```

目前驗證結果：

```text
tests 13
pass 13
fail 0
```

實際發送 LINE 前，需要在專案根目錄建立 `.env` 檔案：

```text
Stock_alert/
  .env
```

`.env` 內容格式：

```text
LINE_CHANNEL_ACCESS_TOKEN=你的_LINE_Channel_Access_Token
LINE_USER_ID=你的_LINE_User_ID
```

實際發送測試訊息指令：

```powershell
npm run line:test
```

如果尚未建立 `.env`，系統會顯示：

```text
Missing required environment variable: LINE_CHANNEL_ACCESS_TOKEN
```

這是正常保護機制，代表程式不會在缺少 LINE token 時送出錯誤請求。

實際發送驗證：

- 使用者已建立 `.env`。
- `npm run line:test` 已成功發送 LINE 測試訊息。
- 使用者確認已收到測試訊息。

LINE Messaging API 建立流程更新：

- 自 2024-09-04 起，已不能直接從 LINE Developers Console 建立 Messaging API channel。
- 正確流程是先到 LINE Official Account Manager 建立官方帳號。
- 在官方帳號後台啟用 Messaging API。
- 啟用後系統會建立對應的 Messaging API channel。
- 再回 LINE Developers Console 取得 `Channel access token`。

相關入口：

- LINE Official Account Manager：`https://manager.line.biz/`
- LINE Developers Console：`https://developers.line.biz/console/`

### 2026-06-04：Step 6 已完成

完成內容：

- 建立批次檢查工作。
- 讀取 `data/watchlist.json` 中所有 `enabled = true` 的股票。
- 對每檔股票取得 Yahoo Finance 最近日線資料。
- 計算 `MA20` 與 `MA60`。
- 判斷是否同時跌破 `MA20` 與 `MA60`。
- 終端機輸出每檔股票的最新價格、MA20、MA60、是否提醒。
- 如果符合提醒條件，會透過 LINE Messaging API 發送提醒。
- 單一股票檢查失敗時，只輸出該股票錯誤，不中斷其他股票。

新增或修改檔案：

- `package.json`
- `src/jobs/checkStocks.js`

執行批次檢查：

```powershell
npm run check
```

本次實際檢查結果：

```text
Checking 6 stocks...

9933.TW 中鼎
  Latest: 42.15
  MA20: 38.80
  MA60: 36.87
  Should alert: NO

2353.TW 宏碁
  Latest: 39.10
  MA20: 31.81
  MA60: 28.99
  Should alert: NO

0050.TW 元大台灣50
  Latest: 106.10
  MA20: 99.28
  MA60: 87.64
  Should alert: NO

5511.TWO 德昌
  Latest: 73.20
  MA20: 71.76
  MA60: 72.14
  Should alert: NO

PLTR Palantir Technologies Inc.
  Latest: 142.20
  MA20: 139.26
  MA60: 143.54
  Should alert: NO

GOOG Alphabet Inc.
  Latest: 355.68
  MA20: 384.61
  MA60: 341.32
  Should alert: NO

Check completed.
Succeeded: 6/6
Alerts: 0
```

目前限制：

- Step 6 尚未加入資料庫。
- Step 6 尚未加入同一天不重複通知控制。
- 重複通知控制會在 Step 8 加入 Supabase 後處理。

使用者本機驗證：

- 使用者已執行 `npm run check`。
- 使用者確認測試成功。

### 2026-06-04：Step 7 已完成

完成內容：

- 建立 GitHub Actions 排程檔。
- 每 30 分鐘自動執行一次股票檢查。
- 支援在 GitHub Actions 頁面手動觸發。
- 每次排程會先跑 `npm test`，再跑 `npm run check`。
- LINE token 不寫在程式碼，改用 GitHub Secrets。

新增或修改檔案：

- `.github/workflows/check-stocks.yml`
- `stock_prd.md`

GitHub Actions 排程檔位置：

```text
.github/workflows/check-stocks.yml
```

排程設定：

```yaml
schedule:
  - cron: "*/30 * * * *"
```

需要在 GitHub repository 設定 Secrets：

```text
LINE_CHANNEL_ACCESS_TOKEN
LINE_USER_ID
```

GitHub Secrets 設定路徑：

```text
GitHub Repository
Settings
Secrets and variables
Actions
New repository secret
```

手動測試 GitHub Actions：

```text
GitHub Repository
Actions
Check Stocks
Run workflow
```

本機驗證：

```powershell
npm test
```

目前驗證結果：

```text
tests 13
pass 13
fail 0
```

注意事項：

- GitHub Actions 的 cron 時間使用 UTC，不是台灣時間。
- 每 30 分鐘排程在 GitHub 免費方案可能有幾分鐘延遲，這是正常現象。
- 只有當專案推送到 GitHub 後，GitHub Actions 才會開始執行。

GitHub Actions 警告修正：

- GitHub 顯示 `Node.js 20 actions are deprecated` 警告。
- 原因是 `actions/checkout@v4` 與 `actions/setup-node@v4` 使用的 action runtime 已過時。
- 已更新為 `actions/checkout@v6` 與 `actions/setup-node@v6`。
- 專案執行環境仍維持 `node-version: "20"`，這是我們自己的程式使用 Node.js 20，不是警告來源。

### 2026-06-04：Step 8 已開始，已加入 Supabase 資料庫支援

完成內容：

- 建立 Supabase 資料表 SQL。
- 建立 Supabase REST API 連線模組，不需要額外安裝 npm 套件。
- `npm run check` 會自動判斷資料來源：
  - 有 `SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY` 時，使用 Supabase。
  - 沒有 Supabase 設定時，沿用 `data/watchlist.json`。
- 使用 Supabase 時，會把每次檢查結果寫入 `stock_price_snapshots`。
- 使用 Supabase 時，符合提醒條件前會先查 `alert_logs`。
- 同一檔股票同一天同一提醒類型已通知過時，不會重複發 LINE。
- GitHub Actions 已加入 Supabase Secrets。

新增或修改檔案：

- `.env.example`
- `.github/workflows/check-stocks.yml`
- `supabase/schema.sql`
- `src/db/supabaseClient.js`
- `src/jobs/checkStocks.js`
- `stock_prd.md`

Supabase SQL 檔案位置：

```text
supabase/schema.sql
```

需要在 Supabase SQL Editor 執行：

```text
supabase/schema.sql
```

本機 `.env` 需要新增：

```text
SUPABASE_URL=你的_Supabase_Project_URL
SUPABASE_SERVICE_ROLE_KEY=你的_Supabase_Service_Role_Key
```

GitHub repository 也需要新增 Secrets：

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

GitHub Secrets 設定路徑：

```text
GitHub Repository
Settings
Secrets and variables
Actions
New repository secret
```

目前本機驗證：

```text
tests 13
pass 13
fail 0
```

尚未填 Supabase 設定時，批次檢查會顯示：

```text
Data source: JSON watchlist
```

填好 Supabase 設定後，批次檢查應顯示：

```text
Data source: Supabase
```

安全提醒：

- `.env.example` 只能放空白範本，不可放真實 token。
- 真實 token 只放在 `.env` 與 GitHub Secrets。
- 如果 token 曾經被提交到 GitHub，請到 LINE 後台重新發行 token，並更新 `.env` 與 GitHub Secrets。

### 2026-06-04：Step 8 Supabase 實際連線驗證完成

完成內容：

- 使用者已找到並設定 Supabase service role key。
- 本機 `.env` 已填入 `SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY`。
- `npm run check` 已成功切換到 Supabase 資料來源。
- 6 檔股票都成功寫入 `stock_price_snapshots`。
- 新增台灣日期起算時間測試，支援同一天不重複通知判斷。

新增或修改檔案：

- `package.json`
- `src/db/supabaseClient.js`
- `tests/supabaseClient.test.js`
- `stock_prd.md`

實際檢查結果摘要：

```text
Checking 6 stocks...
Data source: Supabase
Succeeded: 6/6
Alerts: 0
```

完整測試結果：

```text
tests 14
pass 14
fail 0
```

目前已完成 Step 8 的核心需求：

- 股票清單可從 Supabase 讀取。
- 每次檢查結果會寫入資料庫。
- 符合提醒條件時會先查 `alert_logs`，避免同一天同一狀態重複通知。

仍需使用者確認：

- GitHub Secrets 也要加入 `SUPABASE_URL`。
- GitHub Secrets 也要加入 `SUPABASE_SERVICE_ROLE_KEY`。
- 推上 GitHub 後，手動執行一次 `Check Stocks` workflow，確認雲端也顯示 `Data source: Supabase`。

### 2026-06-04：Step 8B 已完成，新增資料庫最近紀錄查詢

背景：

- 使用者執行 `npm run db:latest` 時出現 `Missing script: "db:latest"`。
- 原因是該指令先前只是下一步建議，尚未實作。

完成內容：

- 新增 `db:latest` 指令。
- 可從 Supabase 讀取最近 10 筆 `stock_price_snapshots`。
- 可快速確認 GitHub Actions 或本機檢查是否持續寫入資料庫。

新增或修改檔案：

- `package.json`
- `src/db/supabaseClient.js`
- `src/jobs/showLatestSnapshots.js`
- `stock_prd.md`

執行指令：

```powershell
npm run db:latest
```

範例輸出：

```text
Latest snapshots:
2026/6/4 18:43:39 | PLTR | price 142.20 | MA20 139.26 | MA60 143.54 | alert NO
2026/6/4 18:43:39 | GOOG | price 355.68 | MA20 384.61 | MA60 341.32 | alert NO
```

目前驗證結果：

```text
tests 14
pass 14
fail 0
```

補充：

- Git 顯示 `LF will be replaced by CRLF` 是 Windows 換行格式提醒，不是錯誤。
- 先前的 commit 和 push 都已成功。

### 2026-06-04：Step 9A 已完成，建立最小本機管理頁

完成內容：

- 新增本機管理頁指令 `npm run admin`。
- 管理頁會讀取 Supabase 的 `stocks` 資料表。
- 第一版只顯示股票清單、名稱、市場、啟用狀態、備註。
- 目前尚未加入新增、編輯、停用功能，這會放在 Step 9B/9C。
- 管理頁透過本機 Node.js 伺服器讀 Supabase，不會把 service role key 放到瀏覽器端。

新增或修改檔案：

- `package.json`
- `.gitignore`
- `src/db/supabaseClient.js`
- `src/server/adminServer.js`
- `stock_prd.md`

啟動管理頁：

```powershell
npm run admin
```

開啟網址：

```text
http://127.0.0.1:3000
```

如果 3000 已被其他服務占用，可以改用：

```powershell
$env:ADMIN_PORT=3001
npm run admin
```

然後開啟：

```text
http://127.0.0.1:3001
```

目前驗證：

- API 已成功從 Supabase 讀取 6 檔股票。
- `npm test` 通過。

目前測試結果：

```text
tests 14
pass 14
fail 0
```

### 2026-06-04：Step 9B 已完成，管理頁新增股票與價格欄位

完成內容：

- 管理頁新增股票表單。
- 表單欄位包含：
  - 股票代號
  - 股票名稱
  - 市場 `US` / `TW`
  - 是否啟用
- 新增股票會寫入 Supabase `stocks` 資料表。
- 管理頁移除備註欄。
- 股票列表新增：
  - 目前股價
  - 月均 `MA20`
  - 季均 `MA60`
  - 最新檢查時間
- 價格欄位來自 Supabase `stock_price_snapshots` 中每檔股票最新一筆紀錄。

新增或修改檔案：

- `src/db/supabaseClient.js`
- `src/server/adminServer.js`
- `stock_prd.md`

使用方式：

```powershell
npm run admin
```

如果使用 cmd 並且要改用 3001 port：

```cmd
set ADMIN_PORT=3001
npm run admin
```

如果使用 PowerShell 並且要改用 3001 port：

```powershell
$env:ADMIN_PORT=3001
npm run admin
```

開啟網址：

```text
http://127.0.0.1:3001
```

注意：

- 如果管理頁已經開著，修改程式後需要停止原本的 `npm run admin`，再重新執行。
- 新增股票後，價格、MA20、MA60 會在下一次 `npm run check` 或 GitHub Actions 排程跑完後出現。
- 新股票代號必須符合 Yahoo Finance 格式，例如台股上市用 `.TW`，上櫃用 `.TWO`。

目前驗證：

- API 已成功從 Supabase 讀取股票清單與最新 snapshot。
- `latest_price`、`ma20`、`ma60` 已可回傳到管理頁。
- 未新增測試股票，避免污染正式追蹤清單。
- `npm test` 通過。

目前測試結果：

```text
tests 14
pass 14
fail 0
```

### 2026-06-04：GitHub Actions 避免重複執行

背景：

- 使用者在 GitHub Actions 看到兩個 `workflow_dispatch` 手動執行同時在跑。
- 本地專案只有一個 workflow 檔案：`.github/workflows/check-stocks.yml`。
- 兩個都顯示手動執行時，通常代表 `Run workflow` 被按了兩次，或頁面重送了一次。

修正內容：

- 已加入 GitHub Actions `concurrency` 設定。
- 同一時間只允許一個 `Check Stocks` workflow 執行。
- 如果新的檢查開始，尚未完成的舊檢查會被取消。

設定內容：

```yaml
concurrency:
  group: check-stocks
  cancel-in-progress: true
```
