/**
 * LINE 訂單通知。用 Messaging API，不是舊的 LINE Notify——
 * 那個已經在 2025/3/31 終止服務了，官方帳號跟 webhook 是現在唯一的正規做法。
 *
 * 設計上這是「錦上添花」的功能，不是關鍵路徑：推播失敗、忘記設定、
 * LINE 那邊掛掉，都不該影響訂單本身有沒有正確處理。所以這裡的函式
 * 永遠不丟出例外，失敗只印 log，呼叫端不用包 try/catch。
 */
import crypto from "node:crypto";

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
// webhook 簽章驗證用，在 LINE Developers Console 的頻道設定裡拿，
// 跟上面的 access token 是不同東西，一個是「你打給 LINE」的憑證，
// 一個是「LINE 打給你」時驗證來源沒被冒充用的
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
// 選填。有填就推播給特定一個人/群組（userId 或 groupId）；
// 沒填就用 broadcast 送給這個官方帳號的所有好友——一人商店自己加自己好友，
// 效果一樣，還省了去查 userId 的步驟。
const TARGET_ID = process.env.LINE_TARGET_ID;

export function isConfigured() {
  return !!CHANNEL_ACCESS_TOKEN;
}

export function isWebhookConfigured() {
  return !!CHANNEL_SECRET;
}

/** 送一則純文字訊息（主動推播）。沒設定或送失敗都只印 log，不會讓呼叫端跟著壞掉。 */
export async function notify(text) {
  if (!CHANNEL_ACCESS_TOKEN) return;

  const endpoint = TARGET_ID
    ? "https://api.line.me/v2/bot/message/push"
    : "https://api.line.me/v2/bot/message/broadcast";
  const body = TARGET_ID
    ? { to: TARGET_ID, messages: [{ type: "text", text: text.slice(0, 5000) }] }
    : { messages: [{ type: "text", text: text.slice(0, 5000) }] };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[line] 推播失敗:", res.status, errText.slice(0, 300));
    }
  } catch (e) {
    console.error("[line] 推播發生錯誤:", e.message);
  }
}

/**
 * 回覆一則訊息（針對使用者傳來的訊息，用 replyToken）。
 * replyToken 只能用一次、大約 30 秒內有效，這是 LINE 的限制，不是這裡自己加的。
 */
export async function reply(replyToken, text) {
  if (!CHANNEL_ACCESS_TOKEN) return;
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ replyToken, messages: [{ type: "text", text: text.slice(0, 5000) }] }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[line] 回覆失敗:", res.status, errText.slice(0, 300));
    }
  } catch (e) {
    console.error("[line] 回覆發生錯誤:", e.message);
  }
}

/**
 * 驗證 webhook 請求真的是 LINE 送來的，不是別人冒充打過來的假訂單資料。
 * rawBody 一定要是還沒被 JSON.parse 過的原始位元組，簽章是對原始 body 算的，
 * 用解析過又重新字串化的版本會對不起來。
 */
export function verifySignature(rawBody, signature) {
  if (!CHANNEL_SECRET || !signature) return false;
  const hash = crypto.createHmac("sha256", CHANNEL_SECRET).update(rawBody).digest("base64");
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** 組一則「新訂單」通知文字，order 是 server/orders.js 裡的訂單物件 */
export function formatOrderNotification(order) {
  const items = order.items || [];
  const digital = items.filter((id) => id.startsWith("AP-SL-") && !id.endsWith(":sub"));
  const subs = items.filter((id) => id.endsWith(":sub"));
  const physical = items.filter((id) => id.startsWith("PH-"));

  const lines = [
    "🔔 新訂單",
    `訂單編號：${order.orderNo}`,
    `金額：NT$${Math.round(order.amount).toLocaleString("en-US")}`,
    `買家：${order.buyer?.name || "—"}（${order.buyer?.email || "—"}）`,
  ];
  if (physical.length) lines.push(`實體商品：${physical.join("、")}`);
  if (digital.length) lines.push(`數位工具：${digital.join("、")}`);
  if (subs.length) lines.push(`訂閱：${subs.map((id) => id.replace(":sub", "")).join("、")}`);
  if (order.shippingTo) lines.push(`收件：${order.shippingTo.county}${order.shippingTo.address}`);

  return lines.join("\n");
}

/** 組一則「過去 N 小時彙總」的回覆文字，summary 來自 orders.summarize(hours) */
export function formatSummary(summary, hours) {
  const lines = [
    `📊 過去 ${hours} 小時彙總`,
    `訂單數：${summary.count} 筆`,
    `總收入：NT$${Math.round(summary.total).toLocaleString("en-US")}`,
  ];
  if (summary.count === 0) lines.push("這段時間還沒有新訂單。");
  return lines.join("\n");
}

/** 使用者傳來的文字要打「匯總」才觸發回覆，這裡收斂常見的同音異字寫法 */
export const SUMMARY_TRIGGERS = ["匯總", "彙總"];
