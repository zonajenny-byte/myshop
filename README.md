# myshop — AuraPlayground

> 每天進步一點，成為更好的自己

一個站賣兩種東西：手作小物（實體）與生活 AI 工具（數位）。工具分兩波：Wave 1 七顆有套裝價，Wave 2 陸續上新的單顆賣。共用同一個購物袋、一次結帳。手作小物有後台可以隨時上新品，不用改程式碼。

React + Vite 前端，`server/` 是配套的 Node 後端。**前端沒有後端也能跑**——沒設定 `VITE_API_BASE` 時進預覽模式，用假資料把所有工具與後台的完整流程跑一遍。

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
  data/catalog.js       所有工具 + WAVE_1_IDS（套裝鎖定的七顆）+ 即將推出。手作小物種子資料也在這，但不是真正來源
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
3. 「+ 新增商品」，可以先傳一張展示圖（手機拍的照片直接用，會自動壓縮），再填名稱、價格、庫存、一句話介紹、規格（最多三行）
4. 沒傳圖的話會用 emoji 圓標代替，兩種都支援，不強制一定要有照片
5. 存檔後首頁跟商店頁立刻看得到，客人馬上買得到

編輯、下架也在同一頁，卡片右下角有「編輯」跟「下架」。換照片時舊檔案會自動清掉，不會留垃圾檔案。

### DEMO 模式的限制（沒接後端時）

後台一樣能用，但資料存在你這台裝置的瀏覽器 localStorage 裡：
- 換一台電腦、換一個瀏覽器都看不到你加的東西
- 客人在他們的裝置上，看到的永遠是種子資料那三件
- 清瀏覽器資料會把你加的商品清掉
- 照片是直接存整包 base64 在 localStorage，瀏覽器通常有 5–10MB 的總容量限制，這模式下别傳太多張

這模式只適合你自己先熟悉介面。**要讓客人真的看到新商品，一定要把 `VITE_API_BASE` 指到部署好的 `server/`。**

---

## 商品資料存在哪、多可靠

`server/products.json` 是一個檔案，重開伺服器資料還在，但如果部署在**檔案系統會重建的平台**（多數 serverless 環境，例如 Vercel Functions），每次重新部署可能被清空。

**商品照片存在 `server/uploads/` 資料夾**，不是塞進 JSON 檔案裡——這樣商品清單 API 回應才不會越養越肥。跟 `products.json` 一樣的限制：檔案系統會重建的平台上，照片可能在重新部署時消失。Railway 的持久磁碟兩個都撐得住。單張圖片上限 5MB（前端已經先壓縮過，正常不會逼近這個數字）。

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

**Wave 1 七顆到齊自動跳套裝價** NT$4,900，不用另外把套裝加進購物袋。Wave 2 之後上的新工具是單顆賣，不會因為新增商品而不小心把套裝條件從七顆變多顆——`WAVE_1_IDS` 鎖死在 `catalog.js`，之後上新品不用管這塊。

購物袋按鈕固定在畫面右下角，不管在哪一頁都找得到。

---

## 接金流與工具執行後端

`server/` 現在管商品上下架 + 綠界結帳 + 客戶登入 + 工具執行（目前食安標示解讀器與下班的緩衝真的接了 AI）：

| 端點 | 用途 | 狀態 |
|---|---|---|
| `POST /api/checkout` | 建訂單，回傳綠界金流的自動送出表單 `{ formHtml }` | ✓ 已接好 |
| `POST /api/ecpay/notify` | 綠界的付款結果通知（server-to-server） | ✓ 已接好 |
| `POST /api/ecpay/result` | 使用者付款完瀏覽器導回這裡 | ✓ 已接好 |
| `POST /api/notify` | 收「做好通知我」的 Email | ✓ 已接好（還沒接寄信服務，先印 log） |
| `POST /v1/auth/magic-link` | 寄一次性登入連結，連結指向 `/tools?token=xxx` | ✓ 已接好（還沒接寄信服務，先印 log） |
| `GET /v1/entitlements` | 回傳 `{ skill_ids: [], credits: 287 }` | ✓ 已接好 |
| `POST /v1/tool/run` | 跑一顆工具，回傳 `{ result, credits }` | ✓ 已接好，`label-reader` 跟 `commute-decompress` 真的接了 Anthropic API |

### 綠界金流（ECPay）

三個環境變數一到手，填進 `server/.env` 就是上線，不用改任何程式碼：

```
ECPAY_MERCHANT_ID=
ECPAY_HASH_KEY=
ECPAY_HASH_IV=
ECPAY_SANDBOX=true    # 正式上線前改成 false
```

**還沒有帳號也能先測完整流程**——綠界公開發布的測試特店帳號，每份官方教學跟 SDK 都在用這組：

```
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
```

只能在 `ECPAY_SANDBOX=true` 用，走的是綠界的測試環境，不會有真的金流。填上這組就能把「加入購物車 → 結帳 → 導去綠界付款頁 → 付款完成 → 數位商品開通」整條路走一遍。正式營業前換成你自己申請到的正式金鑰即可。

也可以在 [vendor.ecpay.com.tw](https://vendor.ecpay.com.tw) 後台「系統開發 → 系統介接測試」申請你專屬的沙盒帳號，效果一樣，只是不用共用那組公開的。

**運作方式**：

1. `/api/checkout` 收到訂單後，把交易欄位依綠界規定的方式排序、算出 `CheckMacValue` 檢查碼，組成一個會自動送出的表單，導去綠界的付款頁
2. 使用者刷卡完成後，綠界會從**伺服器**直接打 `/api/ecpay/notify`（這支的正式名稱其實是 `ReturnURL`，命名容易誤會——它不是瀏覽器會經過的地方）；這裡驗證檢查碼、把訂單標記為已付款，數位商品就寫入該 Email 的擁有權與 300 次點數
3. 使用者的**瀏覽器**另外被導回 `/api/ecpay/result`，這支只負責顯示「謝謝購買」，真正算數的是第 2 步

**金鑰只能放後端。** 前端這包完全不碰 HashKey/HashIV。

**CheckMacValue 是最容易出錯的地方。** 綠界自己也把它列為技術問題第一名——通常是 URL Encode 規則沒對齊 .NET 標準造成的（空白該轉 `+` 不是 `%20`，`~` 跟 `'` 這兩個字元 .NET 會編碼、多數語言預設不會）。`server/lib/ecpay.js` 裡已經處理了這些差異，並附了 `selfTest()` 可以直接跑：

```bash
cd server
node -e "import('./lib/ecpay.js').then(m => console.log(m.selfTest()))"
```

跑出來 `verifies: true`、`rejectsTampered: true` 就代表加密邏輯本身沒問題。真正跟綠界對不對得上，還是要接上金鑰實際跑一次才能確定。

**本機測試 webhook 收不到怎麼辦**：綠界的伺服器連不到 `http://localhost`，本機開發如果要真的收到 `/api/ecpay/notify` 的通知，需要用 [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) 之類的工具開一個對外網址，把 `BACKEND_URL` 設成那個網址。部署到 Railway 之後就不需要這個，因為那本來就是對外網址。

### 客戶登入與工具執行

三步驟串起來：客戶用 Email 拿登入連結 → 憑登入 token 查有沒有買過某顆工具 → 有買而且還有次數才會真的呼叫 AI。

```
POST /v1/auth/magic-link  { email }              → 寄登入連結（目前印在 server log，還沒接寄信服務）
GET  /v1/entitlements     Authorization: Bearer   → { skill_ids: [...], credits: 300 }
POST /v1/tool/run         Authorization: Bearer   → 跑一顆工具，扣一次額度
```

**目前接了 Anthropic API 的有兩顆：**

- `label-reader`（食安標示解讀器）——單輪，拍照判讀，prompt 在 `server/prompts/labelReader.js`
- `commute-decompress`（下班的緩衝）——多輪對話，prompt 在 `server/prompts/commuteDecompress.js`

其他工具（Wave 1 剩下五顆＋Wave 2 新上的三顆）呼叫 `/v1/tool/run` 會回 `501 not_implemented`——不是壞掉，是還沒寫那幾顆的 prompt。要接新的一顆，照 `labelReader.js`（單輪）或 `commuteDecompress.js`（多輪）的形狀寫一支新檔案，在 `server/lib/toolRunner.js` 的 `TOOLS` 註冊一個函式就串起來了。

**下班的緩衝有安全轉導機制，設計上刻意獨立於 AI 服務。** 使用者的話如果透露自我傷害、輕生這類危機訊號，`server/lib/safety.js` 的關鍵字比對會在呼叫 AI **之前**就攔下來，改回傳安心專線 1925 的轉導訊息——就算 `ANTHROPIC_API_KEY` 沒設定或 Anthropic 服務當下打不通，這層防護照樣有效，不會因為 AI 掛了就漏接危機訊號。第二層防護是 system prompt 裡也交代模型自己留意沒命中關鍵字、但語意上同樣透露危機的說法。兩層攔下來的對話都不會扣使用者的判讀次數。

可以直接跑這個確認關鍵字判斷本身沒問題（不用金鑰，純邏輯）：

```bash
cd server
node -e "import('./lib/safety.js').then(m => console.log(m.detectCrisis('今天真的撐不下去了')))"
```

環境變數：

```
ANTHROPIC_API_KEY=          # 去 console.anthropic.com 申請
ANTHROPIC_MODEL=claude-sonnet-5   # 選填，想省成本可以換 Haiku 系列
CUSTOMER_TOKEN_SECRET=      # 客戶登入用的簽章密鑰，要跟 TOKEN_SECRET 不一樣
```

**扣額度的順序刻意設計過**：驗證登入 → 確認買過這顆 → 確認還有次數 → 呼叫 AI 成功 → 才扣一次額度。中間任何一步沒過，或 AI 呼叫失敗，都不會扣到客戶的額度——不會有「AI 掛了但錢/次數還是被扣」這種事。

**魔法連結還沒接真的寄信服務。** 目前 `/v1/auth/magic-link` 只把連結印在伺服器的 log 裡，客人實際上收不到信。正式上線前要接 Resend、SendGrid 之類的寄信 API，把 `server/index.js` 裡那行 `console.log` 換成真的寄信呼叫——其餘登入邏輯不用動。

一次食安標示判讀呼叫大約 NT$0.3–0.6（依實際輸出長度，Sonnet 系列），圖片本身不太影響 token 成本，主要看回傳的 JSON 有多長。**下班的緩衝之後如果要接，是多輪對話**，一次收尾要 4–5 個來回，成本結構會跟其他六顆不同，上線後要單獨追蹤。

---

## 部署

前端 Vercel，`server/` 另外放（Railway 有持久磁碟，比較適合 `products.json` 這種存法）。

```bash
git add -A
git commit -m "feat: 後台上架 + 手作小物與 AI 工具的合併商店"
git push
```

Vercel 匯入這個 repo，環境變數設 `VITE_API_BASE=https://你的後端網址`。

`vercel.json` 已經設好 SPA rewrite，`/tools`、`/admin` 這類路徑直接開才不會 404。

`server/` 部署到 Railway：環境變數設好 `ADMIN_PASSWORD`、`TOKEN_SECRET`、`CORS_ORIGIN`（填你的 Vercel 網域）、`BACKEND_URL`（Railway 給你的網址）、`FRONTEND_URL`（Vercel 網域），金鑰到手後再加上 `ECPAY_MERCHANT_ID`、`ECPAY_HASH_KEY`、`ECPAY_HASH_IV`。

---

## 界線（不要為了轉換率拿掉）

商品頁與工具結果裡的使用限制是刻意寫上去的：

- **食安 / 保養品**：判讀標示，不是實驗室檢驗，也不是皮膚科診斷
- **難開口的對話**：涉及暴力、控制或恐懼的關係不產出腳本，直接指向 113
- **下班的緩衝**：偵測到危機訊號會停止收尾流程，改顯示 1925
- **大決定拆解**：不給法律、稅務、投資建議
- **買房**：不預測房價、不評估增值、不出具法律意見

這些同時是法規風險的防線，也是品牌可信度的來源。
