/**
 * 數位商品的擁有權：哪個 Email 買了哪幾顆 Skill、還剩多少判讀次數。
 * 付款成功後由 newebpay notify 寫入，之後 /v1/entitlements 和 /v1/tool/run
 * （另一組還沒接的端點，見根目錄 README）會讀寫這裡。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "entitlements.json");

const CREDITS_PER_SKILL = 300;

function load() {
  if (!fs.existsSync(FILE)) return {};
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch { return {}; }
}
function save(map) {
  fs.writeFileSync(FILE, JSON.stringify(map, null, 2), "utf8");
}

let byEmail = load();

export function get(email) {
  return byEmail[email] || { skill_ids: [], credits: 0 };
}

/**
 * 買了 skillIds 這幾顆（或套裝展開後的清單），每顆沒重複買過的加 300 次。
 * 同一顆已經有的話不會重複加，避免退款重打或重複通知造成點數暴增。
 */
export function grant(email, skillIds) {
  const cur = byEmail[email] || { skill_ids: [], credits: 0 };
  const newOnes = skillIds.filter((id) => !cur.skill_ids.includes(id));
  const next = {
    skill_ids: [...cur.skill_ids, ...newOnes],
    credits: cur.credits + newOnes.length * CREDITS_PER_SKILL,
  };
  byEmail[email] = next;
  save(byEmail);
  return next;
}

export function spend(email, amount = 1) {
  const cur = byEmail[email];
  if (!cur || cur.credits < amount) return null;
  cur.credits -= amount;
  save(byEmail);
  return cur;
}

export function topUp(email, amount) {
  const cur = byEmail[email] || { skill_ids: [], credits: 0 };
  cur.credits += amount;
  byEmail[email] = cur;
  save(byEmail);
  return cur;
}
