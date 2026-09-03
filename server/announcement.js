/**
 * 首頁公告彈窗設定。JSON 檔案存法，跟其他 store 同一套模式。
 *
 * 只有一筆設定（不是清單），所以直接存一個物件。
 * enabled 關掉的時候前端就不會跳彈窗，不用刪掉內容——
 * 活動結束先關起來，下次要用再打開比較方便。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "announcement.json");

const DEFAULT = {
  enabled: true,
  title: "新上架",
  heading: "自媒體爆款短片生成器",
  body: "抓住前三秒的鉤子，短影音腳本骨架不用等靈感。前三秒鉤子給三種寫法，整支影片的節奏拆解，標題與文案建議一次給。",
  ctaText: "看完整介紹",
  ctaLink: "/skill/viral-video-script",
  image: null, // 選填，data URL 或 /uploads/xxx 路徑
  updatedAt: new Date().toISOString(),
};

function load() {
  if (!fs.existsSync(FILE)) {
    save(DEFAULT);
    return { ...DEFAULT };
  }
  try {
    return { ...DEFAULT, ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
  } catch {
    return { ...DEFAULT };
  }
}
function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
}

let announcement = load();

export function get() {
  return announcement;
}

export function update(input) {
  if (input.heading !== undefined && !String(input.heading).trim()) {
    return { error: "標題不能空白。" };
  }
  announcement = {
    ...announcement,
    ...input,
    enabled: input.enabled !== undefined ? !!input.enabled : announcement.enabled,
    updatedAt: new Date().toISOString(),
  };
  save(announcement);
  return { item: announcement };
}
