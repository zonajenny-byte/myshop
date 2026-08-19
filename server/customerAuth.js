/**
 * 客戶登入。跟後台的 auth.js 邏輯很像，但刻意分開——
 * 後台密碼跟客戶登入是兩個不同的信任範圍，共用一把密鑰是壞習慣，
 * 其中一個外洩不該連帶讓另一個也失守。
 *
 * token 裡直接帶 email（簽章驗證過的話就可信），不用另外存 session，
 * 這樣單一伺服器、多伺服器都不用共享 session 儲存空間。
 */
import crypto from "node:crypto";

const SECRET = process.env.CUSTOMER_TOKEN_SECRET;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天，工具買了不會常常回來，不想讓人一直重新登入

if (!SECRET || SECRET === "change-me-yet-again") {
  console.warn("⚠️  CUSTOMER_TOKEN_SECRET 沒設定或還是範例值，正式環境務必換掉。");
}

function sign(payloadB64) {
  return crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

export function issueCustomerToken(email) {
  const payload = { email, exp: Date.now() + TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

/** 驗證通過回傳 email，沒過回傳 null */
export function verifyCustomerToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const expected = sign(payloadB64);

  const a = Buffer.from(sig || "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload.email || null;
  } catch {
    return null;
  }
}

export function requireCustomer(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const email = verifyCustomerToken(token);
  if (!email) {
    return res.status(401).json({ error: "unauthorized", message: "請重新登入。" });
  }
  req.customerEmail = email;
  next();
}
