/**
 * 最簡單能用的簽章 token，不拉 jsonwebtoken 這種套件進來。
 *
 * token 格式：base64(JSON payload) + "." + HMAC-SHA256 簽章
 * 驗證時重算 HMAC 比對，並檢查是否過期。
 */
import crypto from "node:crypto";

const SECRET = process.env.TOKEN_SECRET;
const TTL_MS = 12 * 60 * 60 * 1000; // 12 小時，後台登入不用長期有效

if (!SECRET || SECRET === "change-me-too") {
  console.warn("⚠️  TOKEN_SECRET 沒設定或還是範例值，正式環境務必換掉。");
}

function sign(payloadB64) {
  return crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

export function issueToken() {
  const payload = { exp: Date.now() + TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [payloadB64, sig] = token.split(".");
  const expected = sign(payloadB64);

  // timing-safe 比對，長度不同時直接視為失敗
  const a = Buffer.from(sig || "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!verifyToken(token)) {
    return res.status(401).json({ error: "unauthorized", message: "請重新登入後台。" });
  }
  next();
}
