import { API_BASE, DEMO } from "./api";
import { adminToken } from "./adminApi";

const LS_KEY = "ap.demo.announcement";

const DEFAULT = {
  enabled: true,
  title: "新上架",
  heading: "自媒體爆款短片生成器",
  body: "抓住前三秒的鉤子，短影音腳本骨架不用等靈感。前三秒鉤子給三種寫法，整支影片的節奏拆解，標題與文案建議一次給。",
  ctaText: "看完整介紹",
  ctaLink: "/skill/viral-video-script",
  image: null,
};

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch { return { ...DEFAULT }; }
}
function writeLocal(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export async function fetchAnnouncement() {
  if (DEMO) return readLocal();
  try {
    const res = await fetch(API_BASE + "/api/announcement");
    if (!res.ok) return { ...DEFAULT, enabled: false };
    return res.json();
  } catch {
    // 後端連不上時就不要跳彈窗，總比跳一個空白框好
    return { ...DEFAULT, enabled: false };
  }
}

export async function adminUpdateAnnouncement(input) {
  if (DEMO) {
    const next = { ...readLocal(), ...input };
    writeLocal(next);
    return next;
  }
  const res = await fetch(API_BASE + "/api/admin/announcement", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken.get()}` },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `更新失敗（${res.status}）`);
  return data;
}

/**
 * 同一個訪客不要每次進首頁都被彈窗打斷，
 * 關掉之後這次瀏覽階段就不再跳（sessionStorage，關掉分頁就重置）。
 */
const SEEN_KEY = "ap.announcement.seen";
export function markSeen() {
  try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
}
export function hasSeen() {
  try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch { return false; }
}
