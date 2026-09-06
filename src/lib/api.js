/**
 * 後端 API
 *
 * 本機開發：VITE_API_BASE=http://localhost:3000
 * 正式環境：VITE_API_BASE=https://api.auraplayground.com
 *
 * 沒設定時走 DEMO 模式，用假資料跑完整流程，方便先看畫面。
 */

import { SKILLS } from "../data/catalog";

export const API_BASE = import.meta.env.VITE_API_BASE || "";
export const DEMO = !API_BASE;

const token = {
  get: () => localStorage.getItem("ap.token"),
  set: (v) => localStorage.setItem("ap.token", v),
  clear: () => localStorage.removeItem("ap.token"),
};

export { token };

async function request(path, { method = "POST", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const t = token.get();
  if (t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `請求失敗（${res.status}）`);
  return data;
}

/** 建立訂單，回傳綠界金流所需的自動送出表單 */
export async function createOrder(order) {
  if (DEMO) {
    await sleep(700);
    return { demo: true, orderNo: "DEMO" + Date.now() };
  }
  return request("/api/checkout", { body: order });
}

/** 寄出一次性登入連結 */
export async function sendMagicLink(email) {
  if (DEMO) { await sleep(600); return { ok: true }; }
  return request("/v1/auth/magic-link", { body: { email } });
}

/** 這個帳號買了哪些數位商品、剩幾次判讀 */
export async function fetchEntitlements() {
  if (DEMO) {
    await sleep(400);
    return { skill_ids: SKILLS.map((s) => s.id), credits: 287 };
  }
  return request("/v1/entitlements", { method: "GET" });
}

/** 跑一顆工具 */
export async function runTool(payload) {
  if (DEMO) {
    await sleep(1100);
    const { demoResult } = await import("../tools/demoData");
    return { result: demoResult(payload.tool, payload), credits: { remaining: 286 } };
  }
  const d = await request("/v1/tool/run", { body: payload });
  return { ...d, result: JSON.parse(d.result) };
}

/** 收「做好通知我」的名單 */
export async function notifyMe(email, item) {
  if (DEMO) { await sleep(400); return { ok: true }; }
  return request("/api/notify", { body: { email, item } });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 圖片壓到視覺處理的建議邊長再上傳。
 * 這一步直接決定每次判讀的 token 成本，不要省略。
 */
export function imageToBase64(file, maxSide = 1568) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    img.onload = () => {
      const side = Math.max(img.width, img.height);
      const scale = side > maxSide ? maxSide / side : 1;
      const cv = document.createElement("canvas");
      cv.width = img.width * scale;
      cv.height = img.height * scale;
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      resolve(cv.toDataURL("image/jpeg", 0.75).split(",")[1]);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}
