/**
 * myshop 後端 — 商品管理
 *
 * 目前只做「手作小物」的上下架。checkout / tool run 之類的端點
 * 是另一塊（見根目錄 README），這支只負責讓你能隨時上新商品。
 *
 *   cp .env.example .env   # 改密碼
 *   npm install
 *   npm run dev
 */
import express from "express";
import cors from "cors";
import { issueToken, requireAdmin } from "./auth.js";
import * as store from "./store.js";

const app = express();
app.use(express.json());

const origins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
app.use(cors({ origin: origins }));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD || ADMIN_PASSWORD === "change-me") {
  console.warn("⚠️  ADMIN_PASSWORD 沒設定或還是範例值，正式環境務必換掉。");
}

/* ---------- 公開：給商店頁面讀 ---------- */

app.get("/api/products", (req, res) => {
  res.json(store.list());
});

/* ---------- 後台登入 ---------- */

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "wrong_password", message: "密碼不對。" });
  }
  res.json({ token: issueToken() });
});

/* ---------- 後台 CRUD，全部要帶 token ---------- */

app.get("/api/admin/products", requireAdmin, (req, res) => {
  res.json(store.list());
});

app.post("/api/admin/products", requireAdmin, (req, res) => {
  const { item, error } = store.create(req.body || {});
  if (error) return res.status(400).json({ error: "invalid", message: error });
  res.status(201).json(item);
});

app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  const { item, error } = store.update(req.params.id, req.body || {});
  if (error) return res.status(400).json({ error: "invalid", message: error });
  res.json(item);
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  const { ok, error } = store.remove(req.params.id);
  if (error) return res.status(404).json({ error: "not_found", message: error });
  res.json({ ok });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`myshop server listening on :${port}`);
});
