/**
 * 折扣碼。JSON 檔案存法，跟 store.js / orders.js 同一套模式。
 *
 * 每組碼固定打七折（折扣 30%），只能用一次。
 * 「用掉」這件事發生在付款確認成功之後（server/index.js 的 ecpay notify 那支），
 * 不是結帳當下——結帳只驗證碼還沒被用過，避免有人結帳到一半棄單卻把碼燒掉。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "discountCodes.json");

export const DISCOUNT_PERCENT = 30; // 打七折 = 折扣 30%

function load() {
  if (!fs.existsSync(FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch { return []; }
}
function save(list) {
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf8");
}

let codes = load();

/** 8 碼英數字，去掉容易看錯的 0/O/1/I，每 4 碼加一個 - 方便閱讀 */
function genCode() {
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let raw = "";
  for (let i = 0; i < 8; i++) raw += charset[crypto.randomInt(charset.length)];
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function generate() {
  let code;
  do { code = genCode(); } while (codes.some((c) => c.code === code)); // 機率極低，但保險一下不要撞碼

  const item = {
    code,
    discountPercent: DISCOUNT_PERCENT,
    used: false,
    usedBy: null,
    usedAt: null,
    createdAt: new Date().toISOString(),
  };
  codes = [...codes, item];
  save(codes);
  return item;
}

export function get(code) {
  return codes.find((c) => c.code === code);
}

export function isValid(code) {
  const c = get(code);
  return !!c && !c.used;
}

/** 標記用掉。只有付款真的成功才會呼叫這個，結帳當下不會。 */
export function redeem(code, email) {
  const idx = codes.findIndex((c) => c.code === code);
  if (idx === -1) return { error: "折扣碼不存在" };
  if (codes[idx].used) return { error: "折扣碼已經用過了" };

  codes[idx] = { ...codes[idx], used: true, usedBy: email || null, usedAt: new Date().toISOString() };
  save(codes);
  return { item: codes[idx] };
}

export function list() {
  return codes;
}

/** 後台想收回一組還沒用掉的碼（例如手滑多產生了一組） */
export function revoke(code) {
  const before = codes.length;
  codes = codes.filter((c) => c.code !== code);
  if (codes.length === before) return { error: "找不到這組折扣碼" };
  save(codes);
  return { ok: true };
}
