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
export async function adminLogin(password) {
  if (!password) throw new Error("請輸入密碼。");

  if (DEMO) {
    adminToken.set("demo-admin-" + Date.now());
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
  return !!adminToken.get();
}
