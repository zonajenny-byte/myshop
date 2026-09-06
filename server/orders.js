/**
 * 訂單持久化。JSON 檔案存法，跟 store.js 同一套模式。
 * 正式量大之後建議換真資料庫，介面（create/get/markPaid/markFailed）保持一樣就好。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "orders.json");

function load() {
  if (!fs.existsSync(FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch { return []; }
}
function save(list) {
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf8");
}

let orders = load();

/** 商店訂單編號：綠界限制英數字、最多 20 碼，這裡用時間戳＋亂碼湊在限制內 */
function genOrderNo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `AP${ts}${rand}`;
}

export function create({ items, bundle, amount, shipping, buyer, shippingTo, discountCode }) {
  const order = {
    orderNo: genOrderNo(),
    items, bundle, amount, shipping,
    buyer, shippingTo,
    discountCode: discountCode || null, // 有帶折扣碼的話存這裡，付款確認成功才會去標記用掉
    status: "pending", // pending → paid | failed
    createdAt: new Date().toISOString(),
    paidAt: null,
    tradeNo: null, // 綠界那邊的交易序號，付款成功才會有
  };
  orders = [...orders, order];
  save(orders);
  return order;
}

export function get(orderNo) {
  return orders.find((o) => o.orderNo === orderNo);
}

export function markPaid(orderNo, tradeNo) {
  const idx = orders.findIndex((o) => o.orderNo === orderNo);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], status: "paid", paidAt: new Date().toISOString(), tradeNo };
  save(orders);
  return orders[idx];
}

export function markFailed(orderNo, reason) {
  const idx = orders.findIndex((o) => o.orderNo === orderNo);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], status: "failed", failReason: reason };
  save(orders);
  return orders[idx];
}

export function list() {
  return orders;
}

/**
 * 過去 hours 小時內已付款訂單的彙總。給 LINE「匯總」回覆用。
 * 只算 status==="paid" 的，pending/failed 不計入營收。
 */
export function summarize(hours) {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const recent = orders.filter((o) => o.status === "paid" && o.paidAt && new Date(o.paidAt).getTime() >= since);
  const total = recent.reduce((a, o) => a + (Number(o.amount) || 0), 0);
  return { count: recent.length, total, orders: recent };
}
