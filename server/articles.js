/**
 * 文章。JSON 檔案存法，跟其他 store 同一套模式。
 *
 * 草稿（published: false）不會出現在公開列表，只有後台看得到——
 * 寫到一半想先存起來，不用怕客人看到沒寫完的東西。
 *
 * 封面圖跟商品照片一樣存成實體檔案放 uploads/，文章資料裡只存路徑，
 * 不把整包 base64 塞進 articles.json。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "articles.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch { return []; }
}
function save(list) {
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf8");
}

let articles = load();

function genId() {
  return "AR" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString("hex").toUpperCase();
}

/** 跟 store.js 同一套圖片處理：base64 存成檔案，已經是路徑就沿用 */
function saveImageIfNeeded(image, articleId) {
  if (!image) return null;
  if (!image.startsWith("data:image/")) return image;

  const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) throw new Error("圖片格式看不懂，請重新選一張");

  const [, ext, b64] = match;
  const buffer = Buffer.from(b64, "base64");
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("圖片太大了，請壓縮到 5MB 以內");

  const filename = `${articleId}-${Date.now()}.${ext === "jpeg" ? "jpg" : ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

function deleteImageFile(imagePath) {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  fs.unlink(path.join(UPLOADS_DIR, path.basename(imagePath)), () => {});
}

/** 公開列表：只回已發布的，最新的排前面，不含內文（列表頁用不到，省流量） */
export function listPublished() {
  return articles
    .filter((a) => a.published)
    .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
    .map(({ body, ...rest }) => ({ ...rest, excerpt: makeExcerpt(body) }));
}

/** 後台列表：草稿也要看得到 */
export function listAll() {
  return articles
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ body, ...rest }) => ({ ...rest, excerpt: makeExcerpt(body) }));
}

export function get(id) {
  return articles.find((a) => a.id === id);
}

/** 公開讀取單篇：草稿不給看 */
export function getPublished(id) {
  const a = get(id);
  return a?.published ? a : null;
}

function makeExcerpt(body) {
  if (!body) return "";
  const plain = String(body).replace(/\s+/g, " ").trim();
  return plain.length > 80 ? plain.slice(0, 80) + "⋯" : plain;
}

function validate(input) {
  const errors = [];
  if (!input.title || !String(input.title).trim()) errors.push("標題不能空白");
  if (!input.body || !String(input.body).trim()) errors.push("內文不能空白");
  return errors;
}

export function create(input) {
  const errors = validate(input);
  if (errors.length) return { error: errors.join("；") };

  const id = genId();
  let cover;
  try { cover = saveImageIfNeeded(input.cover, id); }
  catch (e) { return { error: e.message }; }

  const now = new Date().toISOString();
  const item = {
    id,
    title: String(input.title).trim(),
    body: String(input.body).trim(),
    cover,
    tag: (input.tag || "").trim(),
    published: !!input.published,
    createdAt: now,
    updatedAt: now,
    publishedAt: input.published ? now : null,
  };
  articles = [...articles, item];
  save(articles);
  return { item };
}

export function update(id, input) {
  const idx = articles.findIndex((a) => a.id === id);
  if (idx === -1) return { error: "找不到這篇文章。" };

  const merged = { ...articles[idx], ...input };
  const errors = validate(merged);
  if (errors.length) return { error: errors.join("；") };

  let cover = articles[idx].cover;
  if (input.cover !== undefined) {
    try {
      const saved = saveImageIfNeeded(input.cover, id);
      if (saved !== articles[idx].cover && articles[idx].cover) deleteImageFile(articles[idx].cover);
      cover = saved;
    } catch (e) { return { error: e.message }; }
  }

  // 從草稿變成發布的那一刻才記發布時間，之後再編輯不會把時間往後推
  const wasPublished = articles[idx].published;
  const nowPublished = input.published !== undefined ? !!input.published : wasPublished;
  const now = new Date().toISOString();

  const item = {
    ...articles[idx],
    ...input,
    title: String(merged.title).trim(),
    body: String(merged.body).trim(),
    cover,
    published: nowPublished,
    updatedAt: now,
    publishedAt: nowPublished ? (articles[idx].publishedAt || now) : null,
  };
  articles = articles.map((a) => (a.id === id ? item : a));
  save(articles);
  return { item };
}

export function remove(id) {
  const target = articles.find((a) => a.id === id);
  const before = articles.length;
  articles = articles.filter((a) => a.id !== id);
  if (articles.length === before) return { error: "找不到這篇文章。" };
  if (target?.cover) deleteImageFile(target.cover);
  save(articles);
  return { ok: true };
}
