import { API_BASE, DEMO } from "./api";

const TOKEN_KEY = "ap.admin.token";

export const adminToken = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (v) => localStorage.setItem(TOKEN_KEY, v),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/**
 * DEMO 模式：任何非空密碼都能登入，純粹是為了讓你先摸一輪介面。
 * 接上後端之後，密碼要對到後端 .env 裡的 ADMIN_PASSWORD 才會過。
 */
/** DEMO 模式發的假 token 用這個前綴標記，接上真後端後才認得出來要丟掉 */
const DEMO_PREFIX = "demo-admin-";

export async function adminLogin(password) {
  if (!password) throw new Error("請輸入密碼。");

  if (DEMO) {
    adminToken.set(DEMO_PREFIX + Date.now());
    return;
  }

  const res = await fetch(API_BASE + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "密碼不對。");
  adminToken.set(data.token);
}

export function adminSignOut() {
  adminToken.clear();
}

export function isAdminSignedIn() {
  const t = adminToken.get();
  if (!t) return false;

  // 接上真後端之後，瀏覽器裡可能還留著 DEMO 模式登入時發的假 token。
  // 只看「有沒有 token」的話會誤判成已登入，讓人進得了後台畫面，
  // 但每個 API 請求都會被後端擋成 401——看起來就像「登入了卻什麼都不能做」。
  // 這裡主動清掉，逼使用者用真密碼重新登入一次。
  if (!DEMO && t.startsWith(DEMO_PREFIX)) {
    adminToken.clear();
    return false;
  }
  // 反過來，切回 DEMO 模式時舊的真 token 也沒意義，一併清掉
  if (DEMO && !t.startsWith(DEMO_PREFIX)) {
    adminToken.clear();
    return false;
  }
  return true;
}
