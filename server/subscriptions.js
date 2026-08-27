/**
 * 訂閱狀態。JSON 檔案存法，跟 entitlements.js 同一套模式。
 *
 * 這裡只管「誰訂閱了哪顆工具、到什麼時候」，不管實際扣款這件事——
 * 扣款目前是走跟一次性購買一樣的綠界 AioCheckOut，一次付清一個月，
 * 不是真正的定期定額自動續扣。要做到自動每月扣款，需要另外接綠界的
 * 定期定額 API（欄位跟簽章方式都不一樣），現在還沒做這塊。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "subscriptions.json");

function load() {
  if (!fs.existsSync(FILE)) return {};
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch { return {}; }
}
function save(map) {
  fs.writeFileSync(FILE, JSON.stringify(map, null, 2), "utf8");
}

let subs = load();

const key = (email, skillId) => `${email}::${skillId}`;

export function isActive(email, skillId) {
  const s = subs[key(email, skillId)];
  if (!s || s.status !== "active") return false;
  return new Date(s.periodEnd) > new Date();
}

export function get(email, skillId) {
  return subs[key(email, skillId)] || null;
}

/**
 * 訂閱或續訂。還在有效期內續訂的話從原本的到期日往後延，
 * 已經過期或第一次訂閱則從現在起算，避免續訂把還沒用完的天數蓋掉。
 */
export function subscribe(email, skillId, months = 1) {
  const now = new Date();
  const k = key(email, skillId);
  const existing = subs[k];
  const base = existing && new Date(existing.periodEnd) > now ? new Date(existing.periodEnd) : now;
  const periodEnd = new Date(base);
  periodEnd.setMonth(periodEnd.getMonth() + months);

  subs[k] = {
    email, skillId, status: "active",
    periodEnd: periodEnd.toISOString(),
    updatedAt: now.toISOString(),
  };
  save(subs);
  return subs[k];
}

export function cancel(email, skillId) {
  const k = key(email, skillId);
  if (subs[k]) {
    subs[k].status = "cancelled";
    save(subs);
  }
  return subs[k] || null;
}

/** 這個 Email 目前有效的訂閱，給 /v1/entitlements 用 */
export function listActiveForEmail(email) {
  const now = new Date();
  return Object.values(subs).filter(
    (s) => s.email === email && s.status === "active" && new Date(s.periodEnd) > now
  );
}
