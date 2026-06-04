const LINE_PUSH_MESSAGE_URL = "https://api.line.me/v2/bot/message/push";

export async function sendLineMessage({
  text,
  userId,
  accessToken,
  fetchImpl = fetch
}) {
  if (!text) {
    throw new Error("text is required.");
  }

  if (!userId) {
    throw new Error("LINE_USER_ID is required.");
  }

  if (!accessToken) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is required.");
  }

  const response = await fetchImpl(LINE_PUSH_MESSAGE_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: userId,
      messages: [
        {
          type: "text",
          text
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LINE message failed: ${response.status} ${errorText}`);
  }

  return true;
}
