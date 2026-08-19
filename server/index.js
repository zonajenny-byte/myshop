/**
 * myshop 後端 — 商品管理 + 綠界金流結帳
 *
 *   cp .env.example .env   # 改密碼、之後金鑰一到手也在這裡填
 *   npm install
 *   npm run dev
 */
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { issueToken, requireAdmin } from "./auth.js";
import { issueCustomerToken, requireCustomer } from "./customerAuth.js";
import * as store from "./store.js";
import * as orders from "./orders.js";
import * as entitlements from "./entitlements.js";
import * as ecpay from "./lib/ecpay.js";
import * as anthropic from "./lib/anthropic.js";
import { TOOLS, SKILL_ID_MAP } from "./lib/toolRunner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
// 商品照片用 base64 塞進 JSON body，預設 100kb 上限太小，放寬到 10mb
app.use(express.json({ limit: "10mb" }));
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

/* ---------- 結帳：建訂單、組綠界付款表單 ---------- */

app.post("/api/checkout", (req, res) => {
  const { items, bundle, amount, shipping, buyer, shippingTo } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "invalid", message: "購物袋是空的。" });
  }
  if (!buyer?.name?.trim() || !buyer?.email?.includes("@")) {
    return res.status(400).json({ error: "invalid", message: "姓名和 Email 都要填。" });
  }
  if (!(Number(amount) > 0)) {
    return res.status(400).json({ error: "invalid", message: "金額不對。" });
  }

  const order = orders.create({ items, bundle, amount, shipping, buyer, shippingTo });

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
    // 數位商品用 AP-SL- 開頭辨識，不用另外拉一份商品目錄進後端
    const digitalIds = (order.items || []).filter((id) => id.startsWith("AP-SL-"));
    if (digitalIds.length > 0 && order.buyer?.email) {
      entitlements.grant(order.buyer.email, digitalIds);
    }
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

/** 這個 Email 買了哪些工具、剩幾次判讀 */
app.get("/v1/entitlements", requireCustomer, (req, res) => {
  res.json(entitlements.get(req.customerEmail));
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
  if (!ent.skill_ids.includes(skillId)) {
    return res.status(403).json({ error: "not_owned", message: "這個帳號還沒買這顆工具。" });
  }
  if (ent.credits < 1) {
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
    const remaining = chargeCredit ? (entitlements.spend(email, 1)?.credits ?? ent.credits) : ent.credits;
    res.json({ result: JSON.stringify(result), credits: { remaining } });
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
app.listen(port, () => {
  console.log(`myshop server listening on :${port}`);
  console.log(`綠界金流: ${ecpay.isConfigured() ? "已設定" : "尚未設定"}`);
});
