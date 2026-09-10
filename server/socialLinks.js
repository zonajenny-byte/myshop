/**
 * 外部連結設定：LINE 官方帳號、Instagram、方格子（vocus）部落格。
 * 只有一筆設定，跟 announcement.js 同一套模式。
 *
 * 沒填的連結前端就不顯示對應的按鈕，不會出現空的或壞掉的連結。
 */
import fs from "node:fs";
import { dataFile } from "./lib/dataDir.js";

const FILE = dataFile("socialLinks.json");

const DEFAULT = {
  lineUrl: "",
  igUrl: "",
  vocusUrl: "",
  updatedAt: new Date().toISOString(),
};

function load() {
  if (!fs.existsSync(FILE)) return { ...DEFAULT };
  try { return { ...DEFAULT, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; }
  catch { return { ...DEFAULT }; }
}
function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
}

let links = load();

export function get() {
  return links;
}

const FIELDS = ["lineUrl", "igUrl", "vocusUrl"];

export function update(input) {
  const patch = {};
  for (const key of FIELDS) {
    if (input[key] === undefined) continue;
    const v = String(input[key]).trim();
    // 空字串是合法值（代表「不顯示這個按鈕」），但填了東西就該是看起來像網址的東西
    if (v && !/^https?:\/\//.test(v)) {
      return { error: `${key} 要是完整網址，開頭要有 http:// 或 https://` };
    }
    patch[key] = v;
  }
  links = { ...links, ...patch, updatedAt: new Date().toISOString() };
  save(links);
  return { item: links };
}
