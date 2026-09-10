/**
 * 所有資料檔案（JSON 存檔、上傳的圖片）該寫去哪裡，統一從這裡決定。
 *
 * 背景：Railway（還有大多數雲端平台）每次重新部署都是整個容器重建，
 * 不是「更新程式碼、保留其他東西」——容器裡的檔案系統只活在當次執行期間，
 * 重新部署後就整個消失。之前商品照片、後台編輯的內容、文章都存在
 * server/ 資料夾旁邊，等於存在容器的臨時空間裡，每次重新部署都會不見。
 *
 * 解法是掛一個 Railway Volume（真正持久保存的硬碟），
 * 讓所有資料改寫進 Volume 裡，而不是寫在容器的臨時空間。
 *
 * Railway 掛好 Volume 之後，會自動注入 RAILWAY_VOLUME_MOUNT_PATH 這個環境變數，
 * 值就是你在 Railway 後台設定的掛載路徑（例如 /app/data）。這裡優先用這個路徑；
 * 沒有的話（本機開發、或還沒掛 Volume）就退回 server/ 目錄本身，
 * 行為跟掛 Volume 之前完全一樣，本機開發不用做任何額外設定。
 *
 * 設定方式看 server/README-VOLUME.md。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 這支檔案在 server/lib/ 底下，要往上一層才是 server/ 本身
const SERVER_ROOT = path.join(__dirname, "..");

export const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || SERVER_ROOT;
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/** 給各個 store 檔案用：組出資料檔案的完整路徑 */
export function dataFile(filename) {
  return path.join(DATA_DIR, filename);
}
