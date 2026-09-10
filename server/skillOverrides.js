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
import crypto from "node:crypto";
import path from "node:path";
import { dataFile, UPLOADS_DIR } from "./lib/dataDir.js";

const FILE = dataFile("skillOverrides.json");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** 只有這些欄位能從後台改。toolKey、kind、id 刻意不在裡面。 */
const EDITABLE = ["name", "en", "price", "blurb", "feat", "limit", "emoji", "tint", "image", "image2", "moodImage"];
/** 三種圖片各自的用途：image 是卡片主圖、image2 是滑鼠移上去的第二張、moodImage 是商品頁的氛圍橫幅 */
const IMAGE_FIELDS = ["image", "image2", "moodImage"];

function load() {
  if (!fs.existsSync(FILE)) return {};
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch { return {}; }
}
function save(map) {
  fs.writeFileSync(FILE, JSON.stringify(map, null, 2), "utf8");
}

let overrides = load();

function saveImageIfNeeded(image, skillId, suffix = "") {
  if (!image) return null;
  if (!image.startsWith("data:image/")) return image; // 已經是路徑，沒換圖

  const match = image.match(/^data:image\/([\w+]+);base64,(.+)$/);
  if (!match) throw new Error("圖片格式看不懂，請重新選一張");

  const [, extRaw, b64] = match;
  const buffer = Buffer.from(b64, "base64");
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("圖片太大了，請壓縮到 5MB 以內");

  const ext = extRaw === "jpeg" ? "jpg" : extRaw === "svg+xml" ? "svg" : extRaw;
  const rand = crypto.randomBytes(3).toString("hex");
  const filename = `skill-${skillId}${suffix}-${Date.now()}-${rand}.${ext}`;
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
    if (IMAGE_FIELDS.includes(key)) {
      try {
        // 三張圖各自用不同後綴，避免同一次儲存裡檔名撞在一起
        const suffix = key === "image2" ? "-b" : key === "moodImage" ? "-mood" : "";
        const saved = saveImageIfNeeded(input[key], skillId, suffix);
        const prev = overrides[skillId]?.[key];
        if (saved !== prev && prev) deleteImageFile(prev);
        patch[key] = saved;
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
  // 三張圖都要清掉，不然還原後檔案留在 uploads/ 裡變成孤兒檔案
  for (const field of IMAGE_FIELDS) {
    if (prev[field]) deleteImageFile(prev[field]);
  }
  (prev.gallery || []).forEach(deleteImageFile);
  const next = { ...overrides };
  delete next[skillId];
  overrides = next;
  save(overrides);
  return { ok: true };
}

/** 商品頁的輪播圖，一次加一張，跟 store.js 的實體商品用同一套邏輯 */
export function addGalleryImage(skillId, image) {
  if (!image) return { error: "沒有圖片。" };
  let saved;
  try {
    saved = saveImageIfNeeded(image, skillId, "-gallery");
  } catch (e) {
    return { error: e.message };
  }
  const prev = overrides[skillId] || {};
  const gallery = [...(prev.gallery || []), saved];
  overrides = { ...overrides, [skillId]: { ...prev, gallery, updatedAt: new Date().toISOString() } };
  save(overrides);
  return { item: overrides[skillId] };
}

export function removeGalleryImage(skillId, index) {
  const prev = overrides[skillId];
  if (!prev) return { error: "這顆工具沒有輪播圖。" };
  const gallery = prev.gallery || [];
  const target = gallery[index];
  if (target === undefined) return { error: "找不到這張圖片。" };

  deleteImageFile(target);
  const nextGallery = gallery.filter((_, i) => i !== index);
  overrides = { ...overrides, [skillId]: { ...prev, gallery: nextGallery, updatedAt: new Date().toISOString() } };
  save(overrides);
  return { item: overrides[skillId] };
}
