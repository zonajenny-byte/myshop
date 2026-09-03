import { API_BASE, DEMO, token } from "./api";

const LS_KEY = "ap.demo.articles";

const SEED = [
  {
    id: "AR-DEMO-1",
    title: "為什麼我要做這些工具",
    body: "有天晚上加班到十點，回家路上腦袋還在跑白天沒解完的問題。\n\n那時候想，如果有個東西能在通勤那二十分鐘裡，幫我把今天結束掉就好了——不是叫我「放鬆一點」那種空話，是真的問幾個問題，把做完的跟沒做完的分開，讓沒做完的排到明天去。\n\n後來就有了「下班的緩衝」這顆工具。其他幾顆也都是這樣來的：都是我自己真的卡住過的地方。",
    cover: null,
    tag: "品牌故事",
    published: true,
    createdAt: "2026-08-01T10:00:00.000Z",
    publishedAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
  },
];

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) { writeLocal(SEED); return [...SEED]; }
    return JSON.parse(raw);
  } catch { return [...SEED]; }
}
function writeLocal(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function excerpt(body) {
  if (!body) return "";
  const plain = String(body).replace(/\s+/g, " ").trim();
  return plain.length > 80 ? plain.slice(0, 80) + "⋯" : plain;
}

async function authedFetch(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token.get()}`, ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `請求失敗（${res.status}）`);
  return data;
}

/* ---------- 公開 ---------- */

export async function fetchArticles() {
  if (DEMO) {
    return readLocal()
      .filter((a) => a.published)
      .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
      .map(({ body, ...rest }) => ({ ...rest, excerpt: excerpt(body) }));
  }
  const res = await fetch(API_BASE + "/api/articles");
  if (!res.ok) return [];
  return res.json();
}

export async function fetchArticle(id) {
  if (DEMO) {
    const a = readLocal().find((x) => x.id === id);
    return a?.published ? a : null;
  }
  const res = await fetch(API_BASE + `/api/articles/${id}`);
  if (!res.ok) return null;
  return res.json();
}

/* ---------- 後台 ---------- */

export async function adminListArticles() {
  if (DEMO) {
    return readLocal()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(({ body, ...rest }) => ({ ...rest, excerpt: excerpt(body) }));
  }
  return authedFetch("/api/admin/articles", { method: "GET" });
}

export async function adminGetArticle(id) {
  if (DEMO) return readLocal().find((a) => a.id === id) || null;
  return authedFetch(`/api/admin/articles/${id}`, { method: "GET" });
}

export async function adminCreateArticle(input) {
  if (DEMO) {
    if (!input.title?.trim()) throw new Error("標題不能空白");
    if (!input.body?.trim()) throw new Error("內文不能空白");
    const now = new Date().toISOString();
    const item = {
      id: "AR" + Date.now().toString(36).toUpperCase(),
      title: input.title.trim(), body: input.body.trim(),
      cover: input.cover || null, tag: (input.tag || "").trim(),
      published: !!input.published,
      createdAt: now, updatedAt: now,
      publishedAt: input.published ? now : null,
    };
    writeLocal([...readLocal(), item]);
    return item;
  }
  return authedFetch("/api/admin/articles", { method: "POST", body: JSON.stringify(input) });
}

export async function adminUpdateArticle(id, input) {
  if (DEMO) {
    const list = readLocal();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("找不到這篇文章。");
    const merged = { ...list[idx], ...input };
    if (!merged.title?.trim()) throw new Error("標題不能空白");
    if (!merged.body?.trim()) throw new Error("內文不能空白");
    const now = new Date().toISOString();
    const nowPublished = input.published !== undefined ? !!input.published : list[idx].published;
    const item = {
      ...merged,
      title: merged.title.trim(), body: merged.body.trim(),
      published: nowPublished, updatedAt: now,
      publishedAt: nowPublished ? (list[idx].publishedAt || now) : null,
    };
    writeLocal(list.map((a) => (a.id === id ? item : a)));
    return item;
  }
  return authedFetch(`/api/admin/articles/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function adminRemoveArticle(id) {
  if (DEMO) {
    writeLocal(readLocal().filter((a) => a.id !== id));
    return { ok: true };
  }
  return authedFetch(`/api/admin/articles/${id}`, { method: "DELETE" });
}
