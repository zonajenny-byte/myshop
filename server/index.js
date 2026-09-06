/**
 * myshop 後端 — 商品管理 + 綠界金流結帳
 *
 *   cp .env.example .env   # 改密碼、之後金鑰一到手也在這裡填
 *   npm install
 *   npm run dev
 */

// 這行放在所有 import 之前，只要這支檔案有被 Node 執行到就會印出來。
// 部署平台的 log 若連這行都沒有，代表跑的根本不是這支程式。
console.log("[BOOT] myshop server 檔案已載入 | node", process.version, "| PORT =", process.env.PORT ?? "(未注入)");

import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { issueToken, requireAdmin } from "./auth.js";
import { issueCustomerToken, requireCustomer } from "./customerAuth.js";
import * as store from "./store.js";
import * as orders from "./orders.js";
import * as entitlements from "./entitlements.js";
import * as subscriptions from "./subscriptions.js";
import * as discountCodes from "./discountCodes.js";
import * as announcement from "./announcement.js";
import * as articles from "./articles.js";
import * as ecpay from "./lib/ecpay.js";
import * as line from "./lib/line.js";
import * as anthropic from "./lib/anthropic.js";
import { TOOLS, SKILL_ID_MAP } from "./lib/toolRunner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
// 商品照片用 base64 塞進 JSON body，預設 100kb 上限太小，放寬到 10mb。
// verify 這個 callback 順便把原始位元組存起來——LINE webhook 的簽章是對
// 「還沒被解析過的原始 body」算的，用 JSON.parse 之後重新字串化的版本會兜不起來。
app.use(express.json({
  limit: "10mb",
  verify: (req, res, buf) => { req.rawBody = buf; },
}));
// 綠界的通知是表單格式（application/x-www-form-urlencoded），json() 不吃這個要另外掛
app.use(express.urlencoded({ extended: true }));
// 商品照片檔案，上傳後存在 uploads/，這裡讓它能被公開讀取
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const origins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
app.use(cors({ origin: origins }));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD || ADMIN_PASSWORD === "change-me") {
  console.warn("⚠️  ADMIN_PASSWORD 沒設定或還是範例值，正式環境務必換掉。");
}
if (!ecpay.isConfigured()) {
  console.warn("⚠️  綠界尚未設定（ECPAY_MERCHANT_ID/HASH_KEY/HASH_IV），/api/checkout 會回錯誤訊息。");
}
if (!anthropic.isConfigured()) {
  console.warn("⚠️  ANTHROPIC_API_KEY 沒設定，/v1/tool/run 會回錯誤訊息。");
}
if (!line.isConfigured()) {
  console.log("ℹ️  LINE_CHANNEL_ACCESS_TOKEN 沒設定，新訂單不會推播到 LINE（不影響其他功能）。");
}
if (line.isConfigured() && !line.isWebhookConfigured()) {
  console.log("ℹ️  LINE_CHANNEL_SECRET 沒設定，「匯總」這類回覆指令不會運作（推播仍正常）。");
}

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/* ---------- 公開：給商店頁面讀 ---------- */

app.get("/api/products", (req, res) => {
  res.json(store.list());
});

/* ---------- 後台登入 ---------- */

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "wrong_password", message: "密碼不對。" });
  }
  res.json({ token: issueToken() });
});

/* ---------- 後台 CRUD，全部要帶 token ---------- */

app.get("/api/admin/products", requireAdmin, (req, res) => {
  res.json(store.list());
});

app.post("/api/admin/products", requireAdmin, (req, res) => {
  const { item, error } = store.create(req.body || {});
  if (error) return res.status(400).json({ error: "invalid", message: error });
  res.status(201).json(item);
});

app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  const { item, error } = store.update(req.params.id, req.body || {});
  if (error) return res.status(400).json({ error: "invalid", message: error });
  res.json(item);
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  const { ok, error } = store.remove(req.params.id);
  if (error) return res.status(404).json({ error: "not_found", message: error });
  res.json({ ok });
});

/* ---------- 健康檢查：確認服務真的活著用 ---------- */

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "myshop-server", port: process.env.PORT || 3000, time: new Date().toISOString() });
});

/* ---------- 文章 ---------- */

// 公開：只看得到已發布的
app.get("/api/articles", (req, res) => {
  res.json(articles.listPublished());
});

app.get("/api/articles/:id", (req, res) => {
  const a = articles.getPublished(req.params.id);
  if (!a) return res.status(404).json({ error: "not_found", message: "找不到這篇文章。" });
  res.json(a);
});

// 後台：草稿也看得到
app.get("/api/admin/articles", requireAdmin, (req, res) => {
  res.json(articles.listAll());
});

app.get("/api/admin/articles/:id", requireAdmin, (req, res) => {
  const a = articles.get(req.params.id);
  if (!a) return res.status(404).json({ error: "not_found", message: "找不到這篇文章。" });
  res.json(a);
});

app.post("/api/admin/articles", requireAdmin, (req, res) => {
  const { item, error } = articles.create(req.body || {});
  if (error) return res.status(400).json({ error: "invalid", message: error });
  res.status(201).json(item);
});

app.put("/api/admin/articles/:id", requireAdmin, (req, res) => {
  const { item, error } = articles.update(req.params.id, req.body || {});
  if (error) return res.status(400).json({ error: "invalid", message: error });
  res.json(item);
});

app.delete("/api/admin/articles/:id", requireAdmin, (req, res) => {
  const { ok, error } = articles.remove(req.params.id);
  if (error) return res.status(404).json({ error: "not_found", message: error });
  res.json({ ok });
});

/* ---------- 首頁公告：公開讀取 ---------- */

app.get("/api/announcement", (req, res) => {
  res.json(announcement.get());
});

app.put("/api/admin/announcement", requireAdmin, (req, res) => {
  const { item, error } = announcement.update(req.body || {});
  if (error) return res.status(400).json({ error: "invalid", message: error });
  res.json(item);
});

/* ---------- 後台：折扣碼產生器 ---------- */

app.get("/api/admin/discount-codes", requireAdmin, (req, res) => {
  res.json(discountCodes.list());
});

app.post("/api/admin/discount-codes", requireAdmin, (req, res) => {
  res.status(201).json(discountCodes.generate());
});

app.delete("/api/admin/discount-codes/:code", requireAdmin, (req, res) => {
  const { ok, error } = discountCodes.revoke(req.params.code);
  if (error) return res.status(404).json({ error: "not_found", message: error });
  res.json({ ok });
});

/* ---------- 折扣碼：公開查詢用不用得，不洩漏誰用過、什麼時候產生的 ---------- */

app.get("/api/discount-codes/:code/valid", (req, res) => {
  const dc = discountCodes.get(req.params.code.trim().toUpperCase());
  if (!dc || dc.used) return res.json({ valid: false });
  res.json({ valid: true, discountPercent: dc.discountPercent });
});

/* ---------- 結帳：建訂單、組綠界付款表單 ---------- */

app.post("/api/checkout", (req, res) => {
  const { items, bundle, amount, shipping, buyer, shippingTo, discountCode } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "invalid", message: "購物袋是空的。" });
  }
  if (!buyer?.name?.trim() || !buyer?.email?.includes("@")) {
    return res.status(400).json({ error: "invalid", message: "姓名和 Email 都要填。" });
  }
  if (!(Number(amount) > 0)) {
    return res.status(400).json({ error: "invalid", message: "金額不對。" });
  }

  let normalizedCode = null;
  if (discountCode) {
    normalizedCode = discountCode.trim().toUpperCase();
    if (!discountCodes.isValid(normalizedCode)) {
      return res.status(400).json({ error: "invalid_code", message: "這組折扣碼不存在或已經用過了。" });
    }
  }

  const order = orders.create({ items, bundle, amount, shipping, buyer, shippingTo, discountCode: normalizedCode });

  if (!ecpay.isConfigured()) {
    // 金鑰還沒到手：訂單照樣建立、留下紀錄，但沒辦法真的導去付款頁
    return res.status(503).json({
      error: "payment_not_configured",
      message: "金流尚未設定完成，訂單已留存編號 " + order.orderNo + "，請聯絡賣家完成付款。",
      orderNo: order.orderNo,
    });
  }

  try {
    const itemDesc = bundle ? "AuraPlayground 訂單（含套裝）" : "AuraPlayground 訂單";
    const { formHtml } = ecpay.buildPaymentForm({
      merchantOrderNo: order.orderNo,
      amt: amount,
      itemDesc,
      itemNames: order.items,
      notifyUrl: `${BACKEND_URL}/api/ecpay/notify`,
      clientBackUrl: FRONTEND_URL,
      orderResultUrl: `${BACKEND_URL}/api/ecpay/result`,
    });
    res.json({ formHtml, orderNo: order.orderNo });
  } catch (e) {
    res.status(500).json({ error: "payment_build_failed", message: e.message });
  }
});

/**
 * 綠界 server-to-server 付款通知（文件裡叫 ReturnURL，命名容易誤會——
 * 這支不是瀏覽器會經過的地方，是綠界的伺服器直接打過來確認付款結果）。
 * 這裡才是真正決定訂單成不成立的地方，所以一定要驗證 CheckMacValue。
 *
 * 綠界規定：不管驗證成功或失敗，HTTP 狀態都要回 200；
 * 內容驗證通過回 "1|OK"，沒過或處理失敗回 "0|FAIL"。
 * 沒收到正確格式的回應，綠界會重送通知，連續失敗會停止重試。
 */
app.post("/api/ecpay/notify", (req, res) => {
  let result;
  try {
    result = ecpay.parseCallback(req.body);
  } catch (e) {
    console.error("ecpay notify parse error:", e.message);
    return res.status(200).send("0|FAIL");
  }

  if (!result.valid) {
    console.warn("ecpay notify：CheckMacValue 驗證失敗，忽略");
    return res.status(200).send("0|FAIL");
  }

  const data = result.data;
  const orderNo = data.MerchantTradeNo;
  const order = orders.get(orderNo);

  if (!order) {
    console.warn("ecpay notify：找不到對應訂單", orderNo);
    return res.status(200).send("0|FAIL");
  }

  const success = String(data.RtnCode) === "1";
  if (success) {
    orders.markPaid(orderNo, data.TradeNo || null);
    const items = order.items || [];
    const email = order.buyer?.email;

    // 訂閱項目用 "AP-SL-xx:sub" 表示，跟一次性購買分開處理
    const subIds = items.filter((id) => id.endsWith(":sub"));
    const oneTimeDigitalIds = items.filter((id) => id.startsWith("AP-SL-") && !id.endsWith(":sub"));

    if (oneTimeDigitalIds.length > 0 && email) {
      entitlements.grant(email, oneTimeDigitalIds);
    }
    if (subIds.length > 0 && email) {
      for (const subId of subIds) {
        const skillId = subId.slice(0, -":sub".length);
        subscriptions.subscribe(email, skillId, 1); // 目前一次付款開通一個月，不是自動續扣
      }
    }
    if (order.discountCode) {
      const result = discountCodes.redeem(order.discountCode, email);
      if (result.error) {
        // 理論上結帳當下已經檢查過還沒用，這裡失敗多半是極少見的競態——
        // 訂單本身已經付款成功，不該因為這個回滾，只留 log 讓人知道要人工看一下
        console.warn(`[discount] 訂單 ${orderNo} 的折扣碼 ${order.discountCode} 標記失敗:`, result.error);
      }
    }

    // LINE 通知是錦上添花，不能讓它影響訂單本身有沒有處理成功——
    // 用 line.notify() 內建的錯誤處理，這裡不用包 try/catch，也不 await，
    // 讓它在背景跑，不拖慢對綠界的回應時間
    line.notify(line.formatOrderNotification({ ...order, status: "paid" }));
  } else {
    orders.markFailed(orderNo, data.RtnMsg || "unknown");
  }

  res.status(200).send(success ? "1|OK" : "0|FAIL");
});

/**
 * OrderResultURL：使用者付款完，瀏覽器被綠界導回這裡（POST）。
 * 純粹是給人看的「謝謝購買」畫面用的資料來源，真正決定訂單有沒有成立的
 * 是上面的 /api/ecpay/notify，不是這支——瀏覽器導回這步是可能被跳過或延遲的。
 */
app.post("/api/ecpay/result", (req, res) => {
  let orderNo = null;
  try {
    const result = ecpay.parseCallback(req.body);
    if (result.valid) orderNo = result.data.MerchantTradeNo;
  } catch (e) {
    console.error("ecpay result parse error:", e.message);
  }
  const status = orderNo && orders.get(orderNo)?.status === "paid" ? "success" : "pending";
  res.redirect(`${FRONTEND_URL}/?order=${orderNo || ""}&status=${status}`);
});

/**
 * LINE webhook：接收使用者傳給官方帳號的訊息（跟上面的 notify()/推播是相反方向）。
 * 目前只認一個指令：打「匯總」或「彙總」，回覆過去 2 小時的訂單數與總收入。
 *
 * 一定要驗證簽章——這支端點是公開網址，誰都打得到，沒驗證的話任何人都能
 * 假冒 LINE 傳假事件進來。驗證要用 req.rawBody（原始位元組），不能用
 * express 已經解析過的 req.body 重新字串化，兩者不會一樣。
 */
app.post("/api/line/webhook", (req, res) => {
  const signature = req.headers["x-line-signature"];
  if (!line.verifySignature(req.rawBody, signature)) {
    console.warn("[line-webhook] 簽章驗證失敗，忽略");
    return res.status(401).send("invalid signature");
  }

  const events = req.body.events || [];
  for (const event of events) {
    if (event.type !== "message" || event.message?.type !== "text") continue;
    const text = event.message.text.trim();
    if (line.SUMMARY_TRIGGERS.includes(text)) {
      const hours = 2;
      const summary = orders.summarize(hours);
      line.reply(event.replyToken, line.formatSummary(summary, hours));
    }
  }

  // LINE 規定 webhook 一定要回 200，不管有沒有實際處理事件，
  // 沒回 200 的話 LINE 會覺得送達失敗，重複重送同一批事件
  res.status(200).send("OK");
});

/* ---------- 客戶登入：買家用 Email 登入工具台 ---------- */

/**
 * 寄一次性登入連結。目前還沒接真的寄信服務（Resend/SendGrid 之類），
 * 先把連結印在伺服器 log 裡——開發階段自己看 log 複製連結測試就好，
 * 正式上線前把下面的 console.log 換成真的寄信 API 呼叫。
 */
app.post("/v1/auth/magic-link", (req, res) => {
  const { email } = req.body || {};
  if (!email?.includes("@")) {
    return res.status(400).json({ error: "invalid", message: "Email 格式不對。" });
  }
  const token = issueCustomerToken(email);
  const link = `${FRONTEND_URL}/tools?token=${token}`;
  // TODO：換成真的寄信服務。目前只印在 log，客人收不到信。
  console.log(`[magic-link] ${email} → ${link}`);
  res.json({ ok: true });
});

/** 這個 Email 買了哪些工具、剩幾次判讀、有哪些有效訂閱 */
app.get("/v1/entitlements", requireCustomer, (req, res) => {
  const ent = entitlements.get(req.customerEmail);
  const activeSubscriptions = subscriptions.listActiveForEmail(req.customerEmail);
  res.json({ ...ent, subscriptions: activeSubscriptions });
});

/**
 * 跑一顆工具。順序：驗證登入 → 確認買過這顆 → 確認還有次數 →
 * 真的呼叫 Anthropic → 扣一次額度 → 回傳結果。
 * 中間任何一步沒過，都不會扣到額度。
 */
app.post("/v1/tool/run", requireCustomer, async (req, res) => {
  const email = req.customerEmail;
  const { tool, fields, image, mediaType, context, history } = req.body || {};

  const skillId = SKILL_ID_MAP[tool];
  if (!skillId) {
    return res.status(400).json({ error: "unknown_tool", message: "沒有這顆工具。" });
  }

  const ent = entitlements.get(email);
  const isSubscribed = subscriptions.isActive(email, skillId);
  const owned = ent.skill_ids.includes(skillId) || isSubscribed;

  if (!owned) {
    return res.status(403).json({ error: "not_owned", message: "這個帳號還沒買這顆工具。" });
  }
  // 訂閱期間不限次數，不用檢查共用池的額度
  if (!isSubscribed && ent.credits < 1) {
    return res.status(402).json({ error: "no_credits", message: "判讀次數用完了，請加購。" });
  }

  const run = TOOLS[tool];
  if (!run) {
    return res.status(501).json({ error: "not_implemented", message: "這顆工具還在接，敬請期待。" });
  }
  // 注意：這裡刻意不先檢查 anthropic.isConfigured() 就直接呼叫 run()。
  // 像下班的緩衝這種帶安全轉導的工具，危機偵測是純關鍵字比對，不需要 AI 服務，
  // 如果先擋在「AI 沒設定」這關，會導致 AI 服務掛掉時，正在講危機訊號的使用者
  // 收到的是「服務未設定」而不是安全轉導——安全機制的優先度必須高於服務可用性。
  // 真的需要呼叫 AI 而金鑰沒設定時，callClaude() 自己會丟出清楚的錯誤，
  // 被下面的 catch 接住變成 500，不會是靜默失敗。

  try {
    const { result, chargeCredit } = await run({ fields, image, mediaType, context, history });
    const shouldCharge = chargeCredit && !isSubscribed;
    const remaining = shouldCharge ? (entitlements.spend(email, 1)?.credits ?? ent.credits) : ent.credits;
    res.json({ result: JSON.stringify(result), credits: { remaining }, subscribed: isSubscribed });
  } catch (e) {
    console.error(`[tool-run] ${tool} 失敗:`, e.message);
    res.status(500).json({ error: "tool_failed", message: e.message || "判讀失敗，請再試一次。" });
  }
});

/* ---------- 收「做好通知我」名單 ---------- */

app.post("/api/notify", (req, res) => {
  const { email, item } = req.body || {};
  if (!email?.includes("@")) return res.status(400).json({ error: "invalid", message: "Email 格式不對。" });
  // TODO：目前只回應成功，還沒接實際的名單儲存或寄信。量少的話先手動看 log 也行。
  console.log(`[notify-me] ${email} 想要「${item}」`);
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
// 一定要綁 0.0.0.0，不能用預設的 localhost——
// Railway、Render 這類平台的路由層是從容器外面連進來的，
// 只聽 localhost 的話它們找不到服務，會回「train has not arrived」之類的錯誤。
app.listen(port, "0.0.0.0", () => {
  console.log(`myshop server listening on 0.0.0.0:${port}`);
  console.log(`綠界金流: ${ecpay.isConfigured() ? "已設定" : "尚未設定"}`);
  console.log(`LINE 訂單通知: ${line.isConfigured() ? "已設定" : "尚未設定（選用功能）"}`);
});
