import { API_BASE, DEMO } from "./api";
import { adminToken } from "./adminApi";

const LS_KEY = "ap.demo.discountCodes";

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
}
function writeLocal(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/** 跟後端 discountCodes.js 用同一套產碼規則：8 碼、去掉容易看錯的 0/O/1/I */
function genCode() {
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let raw = "";
  for (let i = 0; i < 8; i++) raw += charset[Math.floor(Math.random() * charset.length)];
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

async function authedFetch(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: { Authorization: `Bearer ${adminToken.get()}`, ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `請求失敗（${res.status}）`);
  return data;
}

/* ---------- 後台：產生 / 列表 / 收回 ---------- */

export async function adminGenerate() {
  if (DEMO) {
    const item = {
      code: genCode(), discountPercent: 30,
      used: false, usedBy: null, usedAt: null,
      createdAt: new Date().toISOString(),
    };
    writeLocal([...readLocal(), item]);
    return item;
  }
  return authedFetch("/api/admin/discount-codes", { method: "POST" });
}

export async function adminList() {
  if (DEMO) return readLocal();
  return authedFetch("/api/admin/discount-codes", { method: "GET" });
}

export async function adminRevoke(code) {
  if (DEMO) {
    writeLocal(readLocal().filter((c) => c.code !== code));
    return { ok: true };
  }
  return authedFetch(`/api/admin/discount-codes/${encodeURIComponent(code)}`, { method: "DELETE" });
}

/* ---------- 客戶結帳時：驗證能不能用 ---------- */

export async function validate(rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false };

  if (DEMO) {
    const dc = readLocal().find((c) => c.code === code);
    if (!dc || dc.used) return { valid: false };
    return { valid: true, discountPercent: dc.discountPercent };
  }

  const res = await fetch(`${API_BASE}/api/discount-codes/${encodeURIComponent(code)}/valid`);
  if (!res.ok) return { valid: false };
  return res.json();
}

/**
 * DEMO 模式專用：因為沒有真的付款流程，示範用的「假裝結帳成功」
 * 直接在這裡把碼標記用掉。真後端的兌現時機是綁在綠界付款確認成功那一刻，
 * 不是這裡——見 server/index.js 的 ecpay notify 處理。
 */
export function demoMarkUsed(rawCode, email) {
  if (!DEMO) return;
  const code = rawCode.trim().toUpperCase();
  writeLocal(readLocal().map((c) =>
    c.code === code ? { ...c, used: true, usedBy: email, usedAt: new Date().toISOString() } : c
  ));
}
