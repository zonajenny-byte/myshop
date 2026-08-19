/**
 * 商品持久化。用一個 JSON 檔案存，重開伺服器資料還在。
 *
 * 這是能立刻動起來的最簡方案，不是長期方案。
 * 如果部署在 Vercel/Railway 這類無狀態或會重建檔案系統的平台，
 * 檔案可能在重新部署時被清空——正式上線建議換成 SQLite 或 Postgres，
 * 邏輯（get/create/update/remove）介面保持一樣，換掉這支檔案就好。
 *
 * 商品照片存法：前端把照片轉成 base64 送過來，這裡解碼寫成真正的檔案
 * 放在 uploads/ 資料夾，商品資料裡只存檔名路徑（例如 /uploads/PH-01-xxx.jpg），
 * 不會把整包 base64 塞進 products.json——那樣檔案會越養越大、每次讀商品清單也變慢。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "products.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB，前端已經有壓縮，正常不會逼近這個上限

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const SEED = [
  {
    id: "PH-01",
    name: "月相手鍊",
    en: "Moon Phase Bracelet",
    price: 1280,
    stock: 50,
    blurb: "月光石與黃銅，隨光線變換色澤。",
    spec: [["材質", "月光石、黃銅"], ["長度", "16–19cm 可調"], ["出貨", "3–5 個工作天"]],
    emoji: "🌙",
    tint: "#F3EDF9",
  },
  {
    id: "PH-02",
    name: "淨化白鼠尾草",
    en: "White Sage Bundle",
    price: 480,
    stock: 120,
    blurb: "淨化空間用，一束約可使用二十次。",
    spec: [["產地", "加州"], ["長度", "約 10cm"], ["注意", "使用時務必通風"]],
    emoji: "🌿",
    tint: "#E7F7F0",
  },
  {
    id: "PH-03",
    name: "手抄祈願筆記本",
    en: "Intention Notebook",
    price: 680,
    stock: 80,
    blurb: "配合顯化筆記使用的空白本，一天一頁。",
    spec: [["頁數", "128 頁"], ["尺寸", "A5"], ["裝訂", "線裝可平攤"]],
    emoji: "📓",
    tint: "#FFF3E4",
  },
];

function load() {
  if (!fs.existsSync(FILE)) {
    save(SEED);
    return SEED;
  }
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    console.error("products.json 壞掉了，回退成種子資料");
    save(SEED);
    return SEED;
  }
}

function save(list) {
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf8");
}

let products = load();

/**
 * 把 base64 圖片存成真正的檔案，回傳可以直接放進商品資料的路徑。
 * 如果傳進來的已經是路徑（沒改圖片、編輯時原樣傳回）就直接沿用，不重存。
 * 丟 Error 的話上層要接住，轉成一般的驗證錯誤訊息回給前端。
 */
function saveImageIfNeeded(image, productId) {
  if (!image) return null;
  if (!image.startsWith("data:image/")) return image; // 已經是路徑，沒有換圖

  const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) throw new Error("圖片格式看不懂，請重新選一張");

  const [, ext, b64] = match;
  const buffer = Buffer.from(b64, "base64");
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("圖片太大了，請壓縮到 5MB 以內");
  }

  const filename = `${productId}-${Date.now()}.${ext === "jpeg" ? "jpg" : ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

function deleteImageFile(imagePath) {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  const full = path.join(UPLOADS_DIR, path.basename(imagePath));
  fs.unlink(full, () => {}); // 刪不掉也沒關係，不影響商品資料本身
}

export function list() {
  return products;
}

export function get(id) {
  return products.find((p) => p.id === id);
}

function slugId(name) {
  const base = "PH-" + Date.now().toString(36).toUpperCase();
  return base;
}

export function create(input) {
  const errors = validate(input);
  if (errors.length) return { error: errors.join("；") };

  const id = input.id?.trim() || slugId(input.name);

  if (products.some((p) => p.id === id)) {
    return { error: "這個商品編號已經用過了。" };
  }

  let image;
  try {
    image = saveImageIfNeeded(input.image, id);
  } catch (e) {
    return { error: e.message };
  }

  const item = {
    id,
    name: input.name.trim(),
    en: (input.en || "").trim(),
    price: Number(input.price),
    stock: Number(input.stock ?? 0),
    blurb: (input.blurb || "").trim(),
    spec: Array.isArray(input.spec) ? input.spec.filter((r) => r[0] && r[1]) : [],
    emoji: input.emoji?.trim() || "✦",
    tint: input.tint?.trim() || "#F3EDF9",
    image,
  };

  products = [...products, item];
  save(products);
  return { item };
}

export function update(id, input) {
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return { error: "找不到這個商品。" };

  const errors = validate({ ...products[idx], ...input });
  if (errors.length) return { error: errors.join("；") };

  let image = products[idx].image;
  if (input.image !== undefined) {
    try {
      const saved = saveImageIfNeeded(input.image, id);
      // 換了新圖才刪舊檔，舊圖路徑沒變（等於沒換圖）就不動它
      if (saved && saved !== products[idx].image && products[idx].image) {
        deleteImageFile(products[idx].image);
      }
      image = saved;
    } catch (e) {
      return { error: e.message };
    }
  }

  const item = {
    ...products[idx],
    ...input,
    price: Number(input.price ?? products[idx].price),
    stock: Number(input.stock ?? products[idx].stock),
    image,
  };
  products = products.map((p) => (p.id === id ? item : p));
  save(products);
  return { item };
}

export function remove(id) {
  const target = products.find((p) => p.id === id);
  const before = products.length;
  products = products.filter((p) => p.id !== id);
  if (products.length === before) return { error: "找不到這個商品。" };
  if (target?.image) deleteImageFile(target.image);
  save(products);
  return { ok: true };
}

function validate(input) {
  const errors = [];
  if (!input.name || !input.name.trim()) errors.push("名稱不能空白");
  if (!(Number(input.price) > 0)) errors.push("價格要大於 0");
  if (input.stock != null && Number(input.stock) < 0) errors.push("庫存不能是負數");
  return errors;
}
