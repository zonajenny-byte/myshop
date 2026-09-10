import { useEffect, useState } from "react";
import { SKILLS as BASE_SKILLS } from "../data/catalog";
import { API_BASE, DEMO } from "./api";
import { adminToken } from "./adminApi";

/**
 * AI 工具的後台編輯。
 *
 * catalog.js 是工具的「真相來源」——清單、toolKey、判讀邏輯都在那裡。
 * 這支只處理後台改過的展示層欄位（名稱、介紹、價格、圖片），
 * 疊在預設值上面。沒改過的欄位自動沿用程式碼裡的版本。
 */

const LS_KEY = "ap.demo.skillOverrides";

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch { return {}; }
}
function writeLocal(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

let cache = null;
const listeners = new Set();
function notify() {
  const merged = mergeSkills(cache || {});
  listeners.forEach((fn) => fn(merged));
}

/** 把覆寫疊到預設值上，回傳完整的工具清單 */
export function mergeSkills(overrides) {
  return BASE_SKILLS.map((s) => {
    const o = overrides[s.id];
    if (!o) return s;
    // updatedAt 是後台記錄用的，不要混進商品資料
    const { updatedAt, ...patch } = o;
    return { ...s, ...patch };
  });
}

export async function fetchOverrides() {
  if (cache) return cache;
  if (DEMO) {
    cache = readLocal();
    return cache;
  }
  try {
    const res = await fetch(API_BASE + "/api/skill-overrides");
    cache = res.ok ? await res.json() : {};
  } catch {
    // 後端連不上就用程式碼裡的預設值，不要讓整個工具頁掛掉
    cache = {};
  }
  return cache;
}

/** 頁面用這個拿工具清單，後台改完會自動重新渲染 */
export function useSkills() {
  const [list, setList] = useState(() => mergeSkills(cache || {}));
  useEffect(() => {
    listeners.add(setList);
    fetchOverrides().then(() => setList(mergeSkills(cache || {})));
    return () => listeners.delete(setList);
  }, []);
  return list;
}

/** 購物袋查商品要用這個，才拿得到改過的價格 */
export function skillById(id) {
  return mergeSkills(cache || {}).find((s) => s.id === id);
}

/* ---------- 後台 ---------- */

export async function adminUpdateSkill(skillId, input) {
  if (DEMO) {
    const map = readLocal();
    const next = { ...map, [skillId]: { ...(map[skillId] || {}), ...input } };
    writeLocal(next);
    cache = next;
    notify();
    return next[skillId];
  }
  const res = await fetch(`${API_BASE}/api/admin/skill-overrides/${encodeURIComponent(skillId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken.get()}` },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `更新失敗（${res.status}）`);
  cache = { ...(cache || {}), [skillId]: data };
  notify();
  return data;
}

export async function adminResetSkill(skillId) {
  if (DEMO) {
    const map = readLocal();
    delete map[skillId];
    writeLocal(map);
    cache = map;
    notify();
    return { ok: true };
  }
  const res = await fetch(`${API_BASE}/api/admin/skill-overrides/${encodeURIComponent(skillId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken.get()}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `還原失敗（${res.status}）`);
  const next = { ...(cache || {}) };
  delete next[skillId];
  cache = next;
  notify();
  return data;
}

/** 商品頁的輪播圖，一次加一張 */
export async function adminAddGallerySkill(skillId, image) {
  if (DEMO) {
    const map = readLocal();
    const prev = map[skillId] || {};
    const next = { ...map, [skillId]: { ...prev, gallery: [...(prev.gallery || []), image] } };
    writeLocal(next);
    cache = next;
    notify();
    return next[skillId];
  }
  const res = await fetch(`${API_BASE}/api/admin/skill-overrides/${encodeURIComponent(skillId)}/gallery`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken.get()}` },
    body: JSON.stringify({ image }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `新增失敗（${res.status}）`);
  cache = { ...(cache || {}), [skillId]: data };
  notify();
  return data;
}

export async function adminRemoveGallerySkill(skillId, index) {
  if (DEMO) {
    const map = readLocal();
    const prev = map[skillId] || {};
    const gallery = (prev.gallery || []).filter((_, i) => i !== index);
    const next = { ...map, [skillId]: { ...prev, gallery } };
    writeLocal(next);
    cache = next;
    notify();
    return next[skillId];
  }
  const res = await fetch(`${API_BASE}/api/admin/skill-overrides/${encodeURIComponent(skillId)}/gallery/${index}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken.get()}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `刪除失敗（${res.status}）`);
  cache = { ...(cache || {}), [skillId]: data };
  notify();
  return data;
}
