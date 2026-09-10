/**
 * AI 工具的後台編輯。
 *
 * 這裡存的是「覆寫」不是完整資料——工具本身的清單、toolKey、判讀邏輯
 * 都還是寫在前端的 catalog.js 裡（那些是程式行為，不該讓人從後台改壞）。
 * 後台改的只有展示層的東西：名稱、介紹、功能重點、價格、圖片。
 *
 * 這樣設計的好處是：
 * - 沒改過的工具不佔空間，檔案裡只有你真的動過的那幾顆
 * - 之後程式碼更新了工具清單，沒被覆寫的欄位會自動跟著更新
 * - toolKey 不在可覆寫清單裡，改不到，判讀邏輯不會被指到不存在的工具
 */
import fs from "node:fs";
import path from "node:path";
import { dataFile, UPLOADS_DIR } from "./lib/dataDir.js";

const FILE = dataFile("skillOverrides.json");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** 只有這些欄位能從後台改。toolKey、kind、id 刻意不在裡面。 */
const EDITABLE = ["name", "en", "price", "blurb", "feat", "limit", "emoji", "tint", "moodImage"];

function load() {
  if (!fs.existsSync(FILE)) return {};
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch { return {}; }
}
function save(map) {
  fs.writeFileSync(FILE, JSON.stringify(map, null, 2), "utf8");
}

let overrides = load();

function saveImageIfNeeded(image, skillId) {
  if (!image) return null;
  if (!image.startsWith("data:image/")) return image; // 已經是路徑，沒換圖

  const match = image.match(/^data:image\/([\w+]+);base64,(.+)$/);
  if (!match) throw new Error("圖片格式看不懂，請重新選一張");

  const [, extRaw, b64] = match;
  const buffer = Buffer.from(b64, "base64");
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("圖片太大了，請壓縮到 5MB 以內");

  const ext = extRaw === "jpeg" ? "jpg" : extRaw === "svg+xml" ? "svg" : extRaw;
  const filename = `skill-${skillId}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

function deleteImageFile(imagePath) {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  fs.unlink(path.join(UPLOADS_DIR, path.basename(imagePath)), () => {});
}

export function getAll() {
  return overrides;
}

export function get(skillId) {
  return overrides[skillId] || null;
}

export function update(skillId, input) {
  if (!skillId) return { error: "缺少工具編號。" };

  const patch = {};
  for (const key of EDITABLE) {
    if (input[key] === undefined) continue;

    if (key === "price") {
      const n = Number(input.price);
      if (!(n > 0)) return { error: "價格要大於 0。" };
      patch.price = Math.round(n);
      continue;
    }
    if (key === "name" && !String(input.name).trim()) {
      return { error: "名稱不能空白。" };
    }
    if (key === "feat") {
      // 功能重點是陣列，濾掉空字串免得畫面出現空白項目
      patch.feat = Array.isArray(input.feat)
        ? input.feat.map((f) => String(f).trim()).filter(Boolean)
        : [];
      continue;
    }
    if (key === "moodImage") {
      try {
        const saved = saveImageIfNeeded(input.moodImage, skillId);
        const prev = overrides[skillId]?.moodImage;
        if (saved !== prev && prev) deleteImageFile(prev);
        patch.moodImage = saved;
      } catch (e) {
        return { error: e.message };
      }
      continue;
    }
    patch[key] = typeof input[key] === "string" ? input[key].trim() : input[key];
  }

  overrides = { ...overrides, [skillId]: { ...(overrides[skillId] || {}), ...patch, updatedAt: new Date().toISOString() } };
  save(overrides);
  return { item: overrides[skillId] };
}

/** 還原成程式碼裡的預設值——把覆寫刪掉就好，不用知道原本是什麼 */
export function reset(skillId) {
  const prev = overrides[skillId];
  if (!prev) return { error: "這顆工具沒有被改過。" };
  if (prev.moodImage) deleteImageFile(prev.moodImage);
  const next = { ...overrides };
  delete next[skillId];
  overrides = next;
  save(overrides);
  return { ok: true };
}
