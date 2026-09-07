import { useEffect, useState } from "react";
import { PHYSICAL as SEED_PHYSICAL, SKILLS } from "../data/catalog";
import { API_BASE, DEMO } from "./api";
import { adminToken } from "./adminApi";

/**
 * 能量小物的動態商品源。
 *
 * DEMO 模式（沒設定 VITE_API_BASE）：存在瀏覽器的 localStorage，
 * 只有你自己這台裝置看得到，適合先摸一輪介面，**不是真的上架**。
 *
 * 接上後端之後：每次都打 /api/products，所有訪客看到同一份資料，
 * 後台改了、客人立刻看得到。
 */

const LS_KEY = "ap.demo.physical";

let cache = null;
const listeners = new Set();
function notify() { listeners.forEach((fn) => fn(cache)); }

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function writeLocal(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

async function authedFetch(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken.get()}`,
    ...(opts.headers || {}),
  };
  const res = await fetch(API_BASE + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `請求失敗（${res.status}）`);
  return data;
}

/** 拉一次商品清單，之後用快取，除非呼叫 refresh() */
export async function fetchPhysical() {
  if (cache) return cache;
  if (DEMO) {
    cache = readLocal() || SEED_PHYSICAL;
    if (!readLocal()) writeLocal(cache);
    return cache;
  }
  const res = await fetch(API_BASE + "/api/products");
  const list = await res.json();
  // 後端早期版本存的商品沒有 kind 欄位，購物袋靠 kind 分類（算運費、判斷收不收地址），
  // 少了它會被當成不明品項、金額整個漏算。在資料進來的源頭統一補上，
  // 比在每個使用端各補一次可靠。
  cache = Array.isArray(list) ? list.map((p) => (p.kind ? p : { ...p, kind: "physical" })) : [];
  return cache;
}

export function refresh() {
  cache = null;
  return fetchPhysical().then((list) => { notify(); return list; });
}

/** 頁面用這個 hook 拿能量小物清單，會在資料變動時自動重新渲染 */
export function usePhysicalProducts() {
  const [list, setList] = useState(cache || SEED_PHYSICAL);
  useEffect(() => {
    listeners.add(setList);
    fetchPhysical().then(setList);
    return () => listeners.delete(setList);
  }, []);
  return list;
}

/** 訂閱項目在購物袋裡用「原始ID:sub」表示，跟一次性購買的同一顆工具分開算 */
export const SUB_SUFFIX = ":sub";
export const subCartId = (skillId) => `${skillId}${SUB_SUFFIX}`;

/** 商品查找，涵蓋能量小物（動態）與七顆工具（靜態）。購物袋要用這個，不要用 catalog.js 的舊版。 */
export function byId(id) {
  if (typeof id === "string" && id.endsWith(SUB_SUFFIX)) {
    const baseId = id.slice(0, -SUB_SUFFIX.length);
    const base = SKILLS.find((s) => s.id === baseId);
    if (!base?.subscription) return null;
    return {
      ...base,
      id,
      kind: "subscription",
      linkedSkillId: base.id,
      name: `${base.name}（訂閱）`,
      price: base.subscription.price,
      periodLabel: base.subscription.periodLabel,
    };
  }
  const physical = cache || SEED_PHYSICAL;
  return [...physical, ...SKILLS].find((p) => p.id === id);
}

/**
 * 商品照片可能是三種形式：DEMO 模式的 base64 data URL（直接能用）、
 * 後端回傳的相對路徑 /uploads/xxx.jpg（要接上 API_BASE 才能讀）、
 * 或完全沒有照片（回傳 null，畫面會退回 emoji 圓標）。
 */
export function resolveImageUrl(image) {
  if (!image) return null;
  if (image.startsWith("data:") || image.startsWith("http")) return image;
  return API_BASE + image;
}

/* ---------- 後台 CRUD ---------- */

export async function adminCreate(input) {
  if (DEMO) {
    const list = cache || SEED_PHYSICAL;
    if (!input.name?.trim()) throw new Error("名稱不能空白。");
    if (!(Number(input.price) > 0)) throw new Error("價格要大於 0。");
    const id = input.id?.trim() || "PH-" + Date.now().toString(36).toUpperCase();
    if (list.some((p) => p.id === id)) throw new Error("這個商品編號已經用過了。");
    const item = {
      id, name: input.name.trim(), en: input.en?.trim() || "",
      price: Number(input.price), stock: Number(input.stock ?? 0),
      blurb: input.blurb?.trim() || "",
      spec: (input.spec || []).filter((r) => r[0] && r[1]),
      emoji: input.emoji?.trim() || "✦", tint: input.tint?.trim() || "#F3EDF9",
      category: input.category || "crystal",
      image2: input.image2 || null,
    };
    cache = [...list, item];
    writeLocal(cache);
    notify();
    return item;
  }
  const item = await authedFetch("/api/admin/products", { method: "POST", body: JSON.stringify(input) });
  await refresh();
  return item;
}

export async function adminUpdate(id, input) {
  if (DEMO) {
    const list = cache || SEED_PHYSICAL;
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("找不到這個商品。");
    const item = { ...list[idx], ...input, price: Number(input.price ?? list[idx].price),
      stock: Number(input.stock ?? list[idx].stock) };
    cache = list.map((p) => (p.id === id ? item : p));
    writeLocal(cache);
    notify();
    return item;
  }
  const item = await authedFetch(`/api/admin/products/${id}`, { method: "PUT", body: JSON.stringify(input) });
  await refresh();
  return item;
}

export async function adminRemove(id) {
  if (DEMO) {
    const list = cache || SEED_PHYSICAL;
    cache = list.filter((p) => p.id !== id);
    writeLocal(cache);
    notify();
    return { ok: true };
  }
  const res = await authedFetch(`/api/admin/products/${id}`, { method: "DELETE" });
  await refresh();
  return res;
}

/** 「還原成範例資料」，方便你在 DEMO 模式弄亂了想重來 */
export function resetDemoData() {
  cache = SEED_PHYSICAL;
  writeLocal(cache);
  notify();
}
