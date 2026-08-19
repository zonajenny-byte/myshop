/**
 * 綠界科技（ECPay）全方位金流串接
 *
 * 跟藍新完全不同的機制：藍新是把整包欄位用 AES 加密起來一起送；
 * 綠界是欄位本身明文送出，另外用 SHA256 算一組「檢查碼」(CheckMacValue)
 * 證明資料沒被竄改過。
 *
 * CheckMacValue 算法（官方文件「檢查碼機制說明」）：
 *   1. 除了 CheckMacValue 本身，其餘參數依參數名稱 A→Z 排序
 *   2. 最前面加 HashKey=xxx、最後面加 &HashIV=xxx，用 & 串接
 *   3. 整串做 URL Encode，規則要跟 .NET 的編碼一致（這是最容易出錯的地方）
 *   4. 全部轉小寫
 *   5. SHA256
 *   6. 結果轉大寫 → 這就是 CheckMacValue
 *
 * .NET 的 URL Encode 跟 JS 內建的 encodeURIComponent 有兩個字元編碼不一樣：
 *   空白：.NET 用 +，JS 用 %20
 *   ~ 和 '：.NET 會編碼成 %7e / %27，JS 預設不編碼
 * 其餘常見符號（! * ( )）兩邊都不編碼，不需要處理。
 * 如果之後真的接上金鑰卻一直出現 CheckMacValue Error，十之八九是這裡的字元編碼對不起來，
 * 綠界自己也把這個列為錯誤原因第一名：https://support.ecpay.com.tw/16692/
 */
import crypto from "node:crypto";

const GATEWAYS = {
  sandbox: "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
  production: "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5",
};

function readEnv() {
  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIv = process.env.ECPAY_HASH_IV;
  if (!merchantId || !hashKey || !hashIv) return null;
  return {
    merchantId,
    hashKey,
    hashIv,
    sandbox: process.env.ECPAY_SANDBOX !== "false",
  };
}

export function isConfigured() {
  return !!readEnv();
}

/** .NET 風格的 URL Encode，綠界的 CheckMacValue 就是照這個規則算的 */
function ecpayUrlEncode(str) {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")   // 空白 → +，不是 %20
    .replace(/~/g, "%7e")   // .NET 會編碼 ~，JS 預設不會
    .replace(/'/g, "%27");  // .NET 會編碼 '，JS 預設不會
}

function sortedQueryString(fields) {
  return Object.keys(fields)
    .filter((k) => fields[k] !== undefined && fields[k] !== null && fields[k] !== "")
    .sort() // 標準字典序排序，剛好符合官方文件講的「A→Z，第一字母相同比第二字母」
    .map((k) => `${k}=${fields[k]}`)
    .join("&");
}

export function computeCheckMacValue(fields, hashKey, hashIv) {
  const sorted = sortedQueryString(fields);
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIv}`;
  const encoded = ecpayUrlEncode(raw).toLowerCase();
  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

export function verifyCheckMacValue(fields, checkMacValue, hashKey, hashIv) {
  const expected = computeCheckMacValue(fields, hashKey, hashIv);
  const a = Buffer.from(expected);
  const b = Buffer.from((checkMacValue || "").toUpperCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function tradeDate(d = new Date()) {
  // 綠界要求格式 yyyy/MM/dd HH:mm:ss
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} `
    + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 組出送給綠界的付款表單。前端拿到 formHtml 後塞進頁面、自動送出，
 * 瀏覽器就會被導去綠界的付款頁。
 *
 * 注意命名陷阱：綠界的 ReturnURL 其實是「後端伺服器對伺服器」的付款通知網址
 * （藍新那邊叫 NotifyURL），不是使用者瀏覽器會被導去的地方。
 * 使用者瀏覽器導回商店用的是 ClientBackURL / OrderResultURL。
 */
export function buildPaymentForm({ merchantOrderNo, amt, itemDesc, itemNames, notifyUrl, clientBackUrl, orderResultUrl }) {
  const e = readEnv();
  if (!e) throw new Error("ECPAY_NOT_CONFIGURED");
  const { merchantId, hashKey, hashIv, sandbox } = e;

  const fields = {
    MerchantID: merchantId,
    MerchantTradeNo: merchantOrderNo, // 限英數字、最多 20 碼，訂單編號產生器已經符合這個限制
    MerchantTradeDate: tradeDate(),
    PaymentType: "aio",
    TotalAmount: Math.round(amt),
    TradeDesc: String(itemDesc).slice(0, 200),
    ItemName: (itemNames || [itemDesc]).join("#").slice(0, 400), // 多樣商品用 # 分隔，官方文件慣例
    ReturnURL: notifyUrl, // 這是伺服器對伺服器的通知網址，不是瀏覽器導回網址
    ChoosePayment: "Credit",
    EncryptType: 1, // 固定值，代表用 SHA256
    ClientBackURL: clientBackUrl,
    OrderResultURL: orderResultUrl,
  };

  const checkMacValue = computeCheckMacValue(fields, hashKey, hashIv);
  const gateway = sandbox ? GATEWAYS.sandbox : GATEWAYS.production;

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const inputs = Object.entries({ ...fields, CheckMacValue: checkMacValue })
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `  <input type="hidden" name="${k}" value="${esc(v)}">`)
    .join("\n");

  const formHtml = `<form id="checkout-form" method="post" action="${gateway}">\n${inputs}\n</form>`;

  return { formHtml, gateway, merchantOrderNo, sandbox };
}

/**
 * 解析綠界打回來的通知（ReturnURL 的 server-to-server webhook，
 * 或 OrderResultURL 的瀏覽器導回都用同一套欄位格式）。
 * valid=false 代表 CheckMacValue 對不上，資料不可信，絕對不能當付款成功處理。
 */
export function parseCallback(body) {
  const e = readEnv();
  if (!e) throw new Error("ECPAY_NOT_CONFIGURED");
  const { hashKey, hashIv } = e;

  const { CheckMacValue, ...fields } = body || {};
  if (!CheckMacValue) return { valid: false, data: null };

  const valid = verifyCheckMacValue(fields, CheckMacValue, hashKey, hashIv);
  return { valid, data: valid ? fields : null };
}

/**
 * 不連綠界，純粹驗證 CheckMacValue 算法本身對不對、能不能正確驗證/正確擋下竄改。
 * 用官方公開多年、每份教學都在用的測試特店帳號跑，這組憑證不是我編的，
 * 是綠界自己在官方文件與 PHP SDK 裡發布的公開測試帳號。
 */
export function selfTest() {
  const hashKey = "5294y06JbISpM5x9";
  const hashIv = "v77hoKGq4kWxNNIS";
  const fields = {
    MerchantID: "2000132",
    MerchantTradeNo: "test" + Date.now(),
    MerchantTradeDate: "2026/01/01 12:00:00",
    PaymentType: "aio",
    TotalAmount: 850,
    TradeDesc: "測試訂單",
    ItemName: "測試商品 x1",
    ReturnURL: "https://example.com/notify",
    ChoosePayment: "Credit",
    EncryptType: 1,
  };

  const checkMacValue = computeCheckMacValue(fields, hashKey, hashIv);
  const verifies = verifyCheckMacValue(fields, checkMacValue, hashKey, hashIv);
  const rejectsTampered = !verifyCheckMacValue({ ...fields, TotalAmount: 999 }, checkMacValue, hashKey, hashIv);

  return { checkMacValue, verifies, rejectsTampered };
}
