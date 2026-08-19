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

/** 商店訂單編號：藍新限制英數字、長度上限，這裡用時間戳＋亂碼湊 20 碼內 */
function genOrderNo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `AP${ts}${rand}`;
}

export function create({ items, bundle, amount, shipping, buyer, shippingTo }) {
  const order = {
    orderNo: genOrderNo(),
    items, bundle, amount, shipping,
    buyer, shippingTo,
    status: "pending", // pending → paid | failed
    createdAt: new Date().toISOString(),
    paidAt: null,
    tradeNo: null, // 藍新那邊的交易序號，付款成功才會有
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
