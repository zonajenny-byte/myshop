/**
 * 商品持久化。用一個 JSON 檔案存，重開伺服器資料還在。
 *
 * 這是能立刻動起來的最簡方案，不是長期方案。
 * 如果部署在 Vercel/Railway 這類無狀態或會重建檔案系統的平台，
 * 檔案可能在重新部署時被清空——正式上線建議換成 SQLite 或 Postgres，
 * 邏輯（get/create/update/remove）介面保持一樣，換掉這支檔案就好。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "products.json");

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

  const item = {
    id: input.id?.trim() || slugId(input.name),
    name: input.name.trim(),
    en: (input.en || "").trim(),
    price: Number(input.price),
    stock: Number(input.stock ?? 0),
    blurb: (input.blurb || "").trim(),
    spec: Array.isArray(input.spec) ? input.spec.filter((r) => r[0] && r[1]) : [],
    emoji: input.emoji?.trim() || "✦",
    tint: input.tint?.trim() || "#F3EDF9",
  };

  if (products.some((p) => p.id === item.id)) {
    return { error: "這個商品編號已經用過了。" };
  }

  products = [...products, item];
  save(products);
  return { item };
}

export function update(id, input) {
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return { error: "找不到這個商品。" };

  const errors = validate({ ...products[idx], ...input });
  if (errors.length) return { error: errors.join("；") };

  const item = {
    ...products[idx],
    ...input,
    price: Number(input.price ?? products[idx].price),
    stock: Number(input.stock ?? products[idx].stock),
  };
  products = products.map((p) => (p.id === id ? item : p));
  save(products);
  return { item };
}

export function remove(id) {
  const before = products.length;
  products = products.filter((p) => p.id !== id);
  if (products.length === before) return { error: "找不到這個商品。" };
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
