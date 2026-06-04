import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sendLineMessage } from "../src/alerts/lineClient.js";

describe("sendLineMessage", () => {
  it("sends a text message with LINE push message format", async () => {
    let requestUrl;
    let requestOptions;

    const fetchImpl = async (url, options) => {
      requestUrl = url;
      requestOptions = options;

      return {
        ok: true
      };
    };

    const result = await sendLineMessage({
      text: "hello",
      userId: "U123",
      accessToken: "token",
      fetchImpl
    });

    assert.equal(result, true);
    assert.equal(requestUrl, "https://api.line.me/v2/bot/message/push");
    assert.equal(requestOptions.method, "POST");
    assert.equal(requestOptions.headers.Authorization, "Bearer token");
    assert.deepEqual(JSON.parse(requestOptions.body), {
      to: "U123",
      messages: [
        {
          type: "text",
          text: "hello"
        }
      ]
    });
  });

  it("throws when LINE returns an error", async () => {
    const fetchImpl = async () => ({
      ok: false,
      status: 401,
      text: async () => "Unauthorized"
    });

    await assert.rejects(
      () =>
        sendLineMessage({
          text: "hello",
          userId: "U123",
          accessToken: "bad-token",
          fetchImpl
        }),
      /LINE message failed: 401 Unauthorized/
    );
  });

  it("throws when required settings are missing", async () => {
    await assert.rejects(
      () =>
        sendLineMessage({
          text: "hello",
          userId: "",
          accessToken: "token",
          fetchImpl: async () => ({ ok: true })
        }),
      /LINE_USER_ID is required/
    );
  });
});
