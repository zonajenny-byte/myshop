# myshop — AuraPlayground

> 每天進步一點，成為更好的自己

一個站賣兩種東西：手作小物（實體）與七顆生活 AI 工具（數位）。共用同一個購物袋、一次結帳。手作小物有後台可以隨時上新品，不用改程式碼。

React + Vite 前端，`server/` 是配套的 Node 後端。**前端沒有後端也能跑**——沒設定 `VITE_API_BASE` 時進預覽模式，用假資料把七顆工具與後台的完整流程跑一遍。

---

## 跑起來

### 只想看前端（預覽模式，不用後端）

```bash
npm install
npm run dev
```

打開 http://localhost:5173，商店、工具台、後台都能點，資料是假的或存在瀏覽器裡。

### 要真的能上架、真的能收款，兩個都要開

```bash
# 第一個終端機：後端
cd server
cp .env.example .env    # 改 ADMIN_PASSWORD 跟 TOKEN_SECRET
npm install
npm run dev              # 預設跑在 :3000

# 第二個終端機：前端
cd ..
echo "VITE_API_BASE=http://localhost:3000" > .env.local
npm install
npm run dev
```

打開 http://localhost:5173/admin，用你在 `server/.env` 設的密碼登入，這時候加的商品是真的存在 `server/products.json`，重開伺服器也還在，而且首頁 `/` 和商店頁 `/shop` 會立刻顯示。

---

## 結構

```
src/
  main.jsx  App.jsx  styles.css
  data/catalog.js       七顆工具 + 套裝 + 即將推出。手作小物種子資料也在這，但不是真正來源
  lib/
    cart.jsx             購物袋（實體與數位混合）
    api.js               工具執行 / 結帳 API
    products.js           ← 手作小物的真正資料來源，DEMO 用 localStorage，接後端後打 API
    adminApi.js           後台登入 / token
  components/
    ProductCard.jsx  CartDrawer.jsx
  pages/
    Home.jsx  Shop.jsx  Skills.jsx  Tools.jsx
    Admin.jsx            ← 後台，路徑 /admin，故意沒放進主導覽

server/
  index.js               Express，商品的公開讀取 + 後台 CRUD
  store.js               JSON 檔案持久化
  auth.js                密碼登入 + 簽章 token（沒拉 jsonwebtoken，純 Node crypto）
  products.json           實際資料庫，重開機資料還在
```

---

## 上架新商品

1. 打開 `/admin`
2. 輸入密碼登入
3. 「+ 新增商品」，填名稱、價格、庫存、一句話介紹、規格（最多三行）、emoji 圖示、卡片底色
4. 存檔後首頁跟商店頁立刻看得到，客人馬上買得到

編輯、下架也在同一頁，卡片右下角有「編輯」跟「下架」。

### DEMO 模式的限制（沒接後端時）

後台一樣能用，但資料存在你這台裝置的瀏覽器 localStorage 裡：
- 換一台電腦、換一個瀏覽器都看不到你加的東西
- 客人在他們的裝置上，看到的永遠是種子資料那三件
- 清瀏覽器資料會把你加的商品清掉

這模式只適合你自己先熟悉介面。**要讓客人真的看到新商品，一定要把 `VITE_API_BASE` 指到部署好的 `server/`。**

---

## 商品資料存在哪、多可靠

`server/products.json` 是一個檔案，重開伺服器資料還在，但如果部署在**檔案系統會重建的平台**（多數 serverless 環境，例如 Vercel Functions），每次重新部署可能被清空。

Railway、Render 這類有持久磁碟的平台沒有這個問題。

如果之後量大了想換成真的資料庫，只要照著 `server/store.js` 的介面重寫（`list / get / create / update / remove`），上面的 `index.js` 完全不用動。

---

## 購物袋的邏輯

| | 實體 | 數位 |
|---|---|---|
| 收件地址 | 必填 | 不問 |
| 運費 | NT$80，滿 2,000 免運 | 不收 |
| 交付 | 3–5 個工作天出貨 | 付款完成立刻開通 |

**混買會怎樣**：手鍊 + 食安解讀器放同一袋，結帳一次。表單會出現地址欄（因為有實體商品），運費只算實體那部分的金額。

**七顆到齊自動跳套裝價** NT$4,900，不用另外把套裝加進購物袋。

購物袋按鈕固定在畫面右下角，不管在哪一頁都找得到。

---

## 接金流與工具執行後端

`server/` 目前只管商品上下架。結帳、寄信、七顆工具的判讀邏輯，是另一組端點，接法在下面：

| 端點 | 用途 |
|---|---|
| `POST /api/checkout` | 建訂單，回傳藍新金流的自動送出表單 `{ formHtml }` |
| `POST /api/notify` | 收「做好通知我」的 Email |
| `POST /v1/auth/magic-link` | 寄一次性登入連結，連結指向 `/tools?token=xxx` |
| `GET /v1/entitlements` | 回傳 `{ skill_ids: [], credits: 287 }` |
| `POST /v1/tool/run` | 跑一顆工具，回傳 `{ result, credits }` |

可以加進同一個 `server/index.js`，或另外開一個服務，只要前端的 `VITE_API_BASE` 指得到就好。

### 藍新金流

`/api/checkout` 收到訂單後：

1. 用 MerchantID + HashKey + HashIV 產生 TradeInfo / TradeSha
2. 回傳一段自動送出到 `https://core.newebpay.com/MPG/mpg_gateway` 的表單 HTML
3. NotifyURL 收到付款成功後：實體商品進待出貨清單；數位商品寫入該 Email 的擁有權與 300 次點數，再寄信請他到 `/tools` 登入

**金鑰只能放後端。** 前端這包完全不碰 HashKey。

### 工具執行

`/v1/tool/run` 依 `tool` 參數挑對應的 system prompt，呼叫 Anthropic API。七顆的 prompt 在另一包 `backend/prompts/`。

一次呼叫約 NT$0.49（system prompt 走快取）。**下班的緩衝是多輪對話**，一次收尾要 4–5 個來回，成本結構跟其他六顆不同，上線後要單獨追蹤。

---

## 部署

前端 Vercel，`server/` 另外放（Railway 有持久磁碟，比較適合 `products.json` 這種存法）。

```bash
git add -A
git commit -m "feat: 後台上架 + 手作小物與七顆 AI 工具的合併商店"
git push
```

Vercel 匯入這個 repo，環境變數設 `VITE_API_BASE=https://你的後端網址`。

`vercel.json` 已經設好 SPA rewrite，`/tools`、`/admin` 這類路徑直接開才不會 404。

`server/` 部署到 Railway：環境變數設好 `ADMIN_PASSWORD`、`TOKEN_SECRET`、`CORS_ORIGIN`（填你的 Vercel 網域）。

---

## 界線（不要為了轉換率拿掉）

商品頁與工具結果裡的使用限制是刻意寫上去的：

- **食安 / 保養品**：判讀標示，不是實驗室檢驗，也不是皮膚科診斷
- **難開口的對話**：涉及暴力、控制或恐懼的關係不產出腳本，直接指向 113
- **下班的緩衝**：偵測到危機訊號會停止收尾流程，改顯示 1925
- **大決定拆解**：不給法律、稅務、投資建議
- **買房**：不預測房價、不評估增值、不出具法律意見

這些同時是法規風險的防線，也是品牌可信度的來源。
