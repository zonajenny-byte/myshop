import { API_BASE, DEMO } from "./api";
import { adminToken } from "./adminApi";

const LS_KEY = "ap.demo.socialLinks";
const DEFAULT = { lineUrl: "", igUrl: "", vocusUrl: "" };

function readLocal() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(LS_KEY)) }; }
  catch { return { ...DEFAULT }; }
}
function writeLocal(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export async function fetchSocialLinks() {
  if (DEMO) return readLocal();
  try {
    const res = await fetch(API_BASE + "/api/social-links");
    return res.ok ? await res.json() : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

export async function adminUpdateSocialLinks(input) {
  if (DEMO) {
    const next = { ...readLocal(), ...input };
    writeLocal(next);
    return next;
  }
  const res = await fetch(API_BASE + "/api/admin/social-links", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken.get()}` },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `更新失敗（${res.status}）`);
  return data;
}
