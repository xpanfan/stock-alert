import { getRequiredEnv, loadEnvFile } from "../config/env.js";
import { sendLineMessage } from "../alerts/lineClient.js";

async function main() {
  loadEnvFile();

  const accessToken = getRequiredEnv("LINE_CHANNEL_ACCESS_TOKEN");
  const userId = getRequiredEnv("LINE_USER_ID");
  const checkedAt = new Date().toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour12: false
  });

  await sendLineMessage({
    accessToken,
    userId,
    text: `Stock Alert LINE 測試訊息\n檢查時間：${checkedAt}`
  });

  console.log("LINE test message sent.");
}

main().catch((error) => {
  console.error("Failed to send LINE test message.");
  console.error(error.message);
  process.exitCode = 1;
});
