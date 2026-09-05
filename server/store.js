/**
 * 商品持久化。用一個 JSON 檔案存，重開伺服器資料還在。
 *
 * 這是能立刻動起來的最簡方案，不是長期方案。
 * 如果部署在 Vercel/Railway 這類無狀態或會重建檔案系統的平台，
 * 檔案可能在重新部署時被清空——正式上線建議換成 SQLite 或 Postgres，
 * 邏輯（get/create/update/remove）介面保持一樣，換掉這支檔案就好。
 *
 * 商品照片存法：前端把照片轉成 base64 送過來，這裡解碼寫成真正的檔案
 * 放在 uploads/ 資料夾，商品資料裡只存檔名路徑（例如 /uploads/PH-01-xxx.jpg），
 * 不會把整包 base64 塞進 products.json——那樣檔案會越養越大、每次讀商品清單也變慢。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "products.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB，前端已經有壓縮，正常不會逼近這個上限

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const SEED = [
  {
    id: "PH-01",
    category: "crystal",
    name: "月相手鍊",
    en: "Moon Phase Bracelet",
    price: 1280,
    stock: 50,
    blurb: "月光石與黃銅，隨光線變換色澤。",
    spec: [["材質", "月光石、黃銅"], ["長度", "16–19cm 可調"], ["出貨", "3–5 個工作天"]],
    emoji: "🌙",
    tint: "#F3EDF9",
    image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIj4KICA8ZGVmcz4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0iYmcxIiBjeD0iNTAlIiBjeT0iNDIlIiByPSI3NSUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRkJGN0ZEIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0VGRTRGNyIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjYmcxKSIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwxNTUpIj4KICAgIDxlbGxpcHNlIGN4PSIwIiBjeT0iMCIgcng9IjEwOCIgcnk9IjEwOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzlBRUU4IiBzdHJva2Utd2lkdGg9IjEuNSIgb3BhY2l0eT0iMC4zIi8+CiAgICA8Y2lyY2xlIGN4PSIwLjAiIGN5PSItMTA4LjAiIHI9IjEzIiBmaWxsPSIjQzlBRUU4IiBvcGFjaXR5PSIwLjkyIi8+CiAgICA8Y2lyY2xlIGN4PSItMy4wIiBjeT0iLTExMS4wIiByPSI0LjUiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuNTUiLz4KICAgIDxjaXJjbGUgY3g9IjQxLjMiIGN5PSItOTkuOCIgcj0iMTAiIGZpbGw9IiNCNDlDREIiIG9wYWNpdHk9IjAuOTIiLz4KICAgIDxjaXJjbGUgY3g9IjM4LjMiIGN5PSItMTAyLjgiIHI9IjMuNSIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC41NSIvPgogICAgPGNpcmNsZSBjeD0iNzYuNCIgY3k9Ii03Ni40IiByPSIxMCIgZmlsbD0iI0RDQzlGMCIgb3BhY2l0eT0iMC45MiIvPgogICAgPGNpcmNsZSBjeD0iNzMuNCIgY3k9Ii03OS40IiByPSIzLjUiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuNTUiLz4KICAgIDxjaXJjbGUgY3g9Ijk5LjgiIGN5PSItNDEuMyIgcj0iMTMiIGZpbGw9IiNBOThCQ0IiIG9wYWNpdHk9IjAuOTIiLz4KICAgIDxjaXJjbGUgY3g9Ijk2LjgiIGN5PSItNDQuMyIgcj0iNC41IiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwLjU1Ii8+CiAgICA8Y2lyY2xlIGN4PSIxMDguMCIgY3k9IjAuMCIgcj0iMTAiIGZpbGw9IiNDOUFFRTgiIG9wYWNpdHk9IjAuOTIiLz4KICAgIDxjaXJjbGUgY3g9IjEwNS4wIiBjeT0iLTMuMCIgcj0iMy41IiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwLjU1Ii8+CiAgICA8Y2lyY2xlIGN4PSI5OS44IiBjeT0iNDEuMyIgcj0iMTAiIGZpbGw9IiNCNDlDREIiIG9wYWNpdHk9IjAuOTIiLz4KICAgIDxjaXJjbGUgY3g9Ijk2LjgiIGN5PSIzOC4zIiByPSIzLjUiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuNTUiLz4KICAgIDxjaXJjbGUgY3g9Ijc2LjQiIGN5PSI3Ni40IiByPSIxMyIgZmlsbD0iI0RDQzlGMCIgb3BhY2l0eT0iMC45MiIvPgogICAgPGNpcmNsZSBjeD0iNzMuNCIgY3k9IjczLjQiIHI9IjQuNSIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC41NSIvPgogICAgPGNpcmNsZSBjeD0iNDEuMyIgY3k9Ijk5LjgiIHI9IjEwIiBmaWxsPSIjQTk4QkNCIiBvcGFjaXR5PSIwLjkyIi8+CiAgICA8Y2lyY2xlIGN4PSIzOC4zIiBjeT0iOTYuOCIgcj0iMy41IiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwLjU1Ii8+CiAgICA8Y2lyY2xlIGN4PSIwLjAiIGN5PSIxMDguMCIgcj0iMTAiIGZpbGw9IiNDOUFFRTgiIG9wYWNpdHk9IjAuOTIiLz4KICAgIDxjaXJjbGUgY3g9Ii0zLjAiIGN5PSIxMDUuMCIgcj0iMy41IiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwLjU1Ii8+CiAgICA8Y2lyY2xlIGN4PSItNDEuMyIgY3k9Ijk5LjgiIHI9IjEzIiBmaWxsPSIjQjQ5Q0RCIiBvcGFjaXR5PSIwLjkyIi8+CiAgICA8Y2lyY2xlIGN4PSItNDQuMyIgY3k9Ijk2LjgiIHI9IjQuNSIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC41NSIvPgogICAgPGNpcmNsZSBjeD0iLTc2LjQiIGN5PSI3Ni40IiByPSIxMCIgZmlsbD0iI0RDQzlGMCIgb3BhY2l0eT0iMC45MiIvPgogICAgPGNpcmNsZSBjeD0iLTc5LjQiIGN5PSI3My40IiByPSIzLjUiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuNTUiLz4KICAgIDxjaXJjbGUgY3g9Ii05OS44IiBjeT0iNDEuMyIgcj0iMTAiIGZpbGw9IiNBOThCQ0IiIG9wYWNpdHk9IjAuOTIiLz4KICAgIDxjaXJjbGUgY3g9Ii0xMDIuOCIgY3k9IjM4LjMiIHI9IjMuNSIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC41NSIvPgogICAgPGNpcmNsZSBjeD0iLTEwOC4wIiBjeT0iMC4wIiByPSIxMyIgZmlsbD0iI0M5QUVFOCIgb3BhY2l0eT0iMC45MiIvPgogICAgPGNpcmNsZSBjeD0iLTExMS4wIiBjeT0iLTMuMCIgcj0iNC41IiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwLjU1Ii8+CiAgICA8Y2lyY2xlIGN4PSItOTkuOCIgY3k9Ii00MS4zIiByPSIxMCIgZmlsbD0iI0I0OUNEQiIgb3BhY2l0eT0iMC45MiIvPgogICAgPGNpcmNsZSBjeD0iLTEwMi44IiBjeT0iLTQ0LjMiIHI9IjMuNSIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC41NSIvPgogICAgPGNpcmNsZSBjeD0iLTc2LjQiIGN5PSItNzYuNCIgcj0iMTAiIGZpbGw9IiNEQ0M5RjAiIG9wYWNpdHk9IjAuOTIiLz4KICAgIDxjaXJjbGUgY3g9Ii03OS40IiBjeT0iLTc5LjQiIHI9IjMuNSIgZmlsbD0iI0ZGRkZGRiIgb3BhY2l0eT0iMC41NSIvPgogICAgPGNpcmNsZSBjeD0iLTQxLjMiIGN5PSItOTkuOCIgcj0iMTMiIGZpbGw9IiNBOThCQ0IiIG9wYWNpdHk9IjAuOTIiLz4KICAgIDxjaXJjbGUgY3g9Ii00NC4zIiBjeT0iLTEwMi44IiByPSI0LjUiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAuNTUiLz4KICAgIDxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSIzIiBmaWxsPSIjOEI2QkFFIiBvcGFjaXR5PSIwLjUiLz4KICA8L2c+Cjwvc3ZnPgo=",
    image2: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIj4KICA8ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImciIGN4PSI1MCUiIGN5PSI0NSUiIHI9IjcwJSI+CiAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNGREY5RkUiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNFNkRBRjMiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNnKSIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwxNTApIj4KICAgIDxwYXRoIGQ9Ik0tMTIwIDAgUSAtNjAgLTU1IDAgLTMwIFEgNjAgLTUgMTIwIC00NiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQjQ5Q0RCIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9IjAuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgICA8Y2lyY2xlIGN4PSItMTA4IiBjeT0iLTgiIHI9IjExIiBmaWxsPSIjQzlBRUU4IiBvcGFjaXR5PSIwLjkiLz48Y2lyY2xlIGN4PSItMTExIiBjeT0iLTExIiByPSI0IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjU1Ii8+CiAgICA8Y2lyY2xlIGN4PSItNzIiIGN5PSItMzMiIHI9IjE0IiBmaWxsPSIjQTk4QkNCIiBvcGFjaXR5PSIwLjkiLz48Y2lyY2xlIGN4PSItNzYiIGN5PSItMzciIHI9IjUiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuNTUiLz4KICAgIDxjaXJjbGUgY3g9Ii0zNCIgY3k9Ii0zOCIgcj0iMTAiIGZpbGw9IiNEQ0M5RjAiIG9wYWNpdHk9IjAuOSIvPjxjaXJjbGUgY3g9Ii0zNyIgY3k9Ii00MSIgcj0iMy41IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjU1Ii8+CiAgICA8Y2lyY2xlIGN4PSIyIiBjeT0iLTMwIiByPSIxNSIgZmlsbD0iI0M5QUVFOCIgb3BhY2l0eT0iMC45MiIvPjxjaXJjbGUgY3g9Ii0zIiBjeT0iLTM1IiByPSI1LjUiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuNiIvPgogICAgPGNpcmNsZSBjeD0iNDAiIGN5PSItMjAiIHI9IjEwIiBmaWxsPSIjQjQ5Q0RCIiBvcGFjaXR5PSIwLjkiLz48Y2lyY2xlIGN4PSIzNyIgY3k9Ii0yMyIgcj0iMy41IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjU1Ii8+CiAgICA8Y2lyY2xlIGN4PSI3OCIgY3k9Ii0zMCIgcj0iMTMiIGZpbGw9IiNEQ0M5RjAiIG9wYWNpdHk9IjAuOSIvPjxjaXJjbGUgY3g9Ijc0IiBjeT0iLTM0IiByPSI0LjUiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuNTUiLz4KICAgIDxjaXJjbGUgY3g9IjExNCIgY3k9Ii00NCIgcj0iMTAiIGZpbGw9IiNBOThCQ0IiIG9wYWNpdHk9IjAuOSIvPjxjaXJjbGUgY3g9IjExMSIgY3k9Ii00NyIgcj0iMy41IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjU1Ii8+CiAgICA8ZyBzdHJva2U9IiM4QjZCQUUiIHN0cm9rZS13aWR0aD0iMS41IiBvcGFjaXR5PSIwLjQiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+CiAgICAgIDxwYXRoIGQ9Ik0tNjAgNDQgTC02MCA2MiBNLTY5IDUzIEwtNTEgNTMiLz48cGF0aCBkPSJNNDYgNTIgTDQ2IDY2IE0zOSA1OSBMNTMgNTkiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPgo=",
  },
  {
    id: "PH-02",
    category: "selected",
    name: "淨化白鼠尾草",
    en: "White Sage Bundle",
    price: 480,
    stock: 120,
    blurb: "淨化空間用，一束約可使用二十次。",
    spec: [["產地", "加州"], ["長度", "約 10cm"], ["注意", "使用時務必通風"]],
    emoji: "🌿",
    tint: "#E7F7F0",
    image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIj4KICA8ZGVmcz4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0iYmcyIiBjeD0iNTAlIiBjeT0iNDAlIiByPSI3NSUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRjVGQkY4Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0UyRjNFQSIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjYmcyKSIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwxNjApIHJvdGF0ZSgtOCkiPgogICAgPGxpbmUgeDE9IjAiIHkxPSItOTUiIHgyPSIwIiB5Mj0iOTAiIHN0cm9rZT0iIzdGQUU4RSIgc3Ryb2tlLXdpZHRoPSIzIiBvcGFjaXR5PSIwLjQiLz4KICAgIDxlbGxpcHNlIGN4PSItMTYiIGN5PSItNzAiIHJ4PSIxNyIgcnk9IjMyIiBmaWxsPSIjOEZDMjlFIiBvcGFjaXR5PSIwLjg4IiB0cmFuc2Zvcm09InJvdGF0ZSgtMTggLTE2IC03MCkiLz4KICAgIDxlbGxpcHNlIGN4PSIxNiIgY3k9Ii03MiIgcng9IjE3IiByeT0iMzIiIGZpbGw9IiM3OUFFOEEiIG9wYWNpdHk9IjAuODgiIHRyYW5zZm9ybT0icm90YXRlKDE2IDE2IC03MikiLz4KICAgIDxlbGxpcHNlIGN4PSItMjAiIGN5PSItMzAiIHJ4PSIxOCIgcnk9IjM0IiBmaWxsPSIjOUJDQkE4IiBvcGFjaXR5PSIwLjg4IiB0cmFuc2Zvcm09InJvdGF0ZSgtMTQgLTIwIC0zMCkiLz4KICAgIDxlbGxpcHNlIGN4PSIyMCIgY3k9Ii0zMiIgcng9IjE4IiByeT0iMzQiIGZpbGw9IiM3RkFFOEUiIG9wYWNpdHk9IjAuODgiIHRyYW5zZm9ybT0icm90YXRlKDE0IDIwIC0zMikiLz4KICAgIDxlbGxpcHNlIGN4PSItMTgiIGN5PSIxMCIgcng9IjE4IiByeT0iMzQiIGZpbGw9IiM4RkMyOUUiIG9wYWNpdHk9IjAuODgiIHRyYW5zZm9ybT0icm90YXRlKC0xMiAtMTggMTApIi8+CiAgICA8ZWxsaXBzZSBjeD0iMTgiIGN5PSI4IiByeD0iMTgiIHJ5PSIzNCIgZmlsbD0iIzlCQ0JBOCIgb3BhY2l0eT0iMC44OCIgdHJhbnNmb3JtPSJyb3RhdGUoMTIgMTggOCkiLz4KICAgIDxlbGxpcHNlIGN4PSIwIiBjeT0iNDIiIHJ4PSIxOSIgcnk9IjM2IiBmaWxsPSIjNzlBRThBIiBvcGFjaXR5PSIwLjkiLz4KICAgIDxnIHN0cm9rZT0iIzVBOEI2QSIgc3Ryb2tlLXdpZHRoPSIyLjUiIG9wYWNpdHk9IjAuNTUiIGZpbGw9Im5vbmUiPgogICAgICA8cGF0aCBkPSJNIC0yMCwtODggUSAwLC04NCAyMCwtODgiLz4KICAgICAgPHBhdGggZD0iTSAtMjAsLTY0IFEgMCwtNjAgMjAsLTY0Ii8+CiAgICA8L2c+CiAgICA8cmVjdCB4PSItMjQiIHk9Ijc2IiB3aWR0aD0iNDgiIGhlaWdodD0iMTAiIHJ4PSIzIiBmaWxsPSIjRDk4QTRFIiBvcGFjaXR5PSIwLjg1Ii8+CiAgICA8cmVjdCB4PSItMjQiIHk9IjkwIiB3aWR0aD0iNDgiIGhlaWdodD0iNyIgcng9IjMiIGZpbGw9IiNEOThBNEUiIG9wYWNpdHk9IjAuNyIvPgogIDwvZz4KPC9zdmc+Cg==",
    image2: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIj4KICA8ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImciIGN4PSI1MCUiIGN5PSI0MCUiIHI9IjcyJSI+CiAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNGN0ZDRjkiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNEOUVGRTMiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNnKSIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwxNjApIj4KICAgIDxlbGxpcHNlIGN4PSIwIiBjeT0iNTIiIHJ4PSI4NiIgcnk9IjE1IiBmaWxsPSIjOUJDQkE4IiBvcGFjaXR5PSIwLjI4Ii8+CiAgICA8ZyB0cmFuc2Zvcm09InJvdGF0ZSgtNzIpIj4KICAgICAgPGxpbmUgeDE9IjAiIHkxPSItODYiIHgyPSIwIiB5Mj0iODAiIHN0cm9rZT0iIzdGQUU4RSIgc3Ryb2tlLXdpZHRoPSIzLjUiIG9wYWNpdHk9IjAuNDUiLz4KICAgICAgPGVsbGlwc2UgY3g9Ii0xNSIgY3k9Ii01OCIgcng9IjE1IiByeT0iMjkiIGZpbGw9IiM4RkMyOUUiIG9wYWNpdHk9IjAuODgiIHRyYW5zZm9ybT0icm90YXRlKC0yMCAtMTUgLTU4KSIvPgogICAgICA8ZWxsaXBzZSBjeD0iMTUiIGN5PSItNjAiIHJ4PSIxNSIgcnk9IjI5IiBmaWxsPSIjNzlBRThBIiBvcGFjaXR5PSIwLjg4IiB0cmFuc2Zvcm09InJvdGF0ZSgxOCAxNSAtNjApIi8+CiAgICAgIDxlbGxpcHNlIGN4PSItMTgiIGN5PSItMjAiIHJ4PSIxNiIgcnk9IjMxIiBmaWxsPSIjOUJDQkE4IiBvcGFjaXR5PSIwLjg4IiB0cmFuc2Zvcm09InJvdGF0ZSgtMTUgLTE4IC0yMCkiLz4KICAgICAgPGVsbGlwc2UgY3g9IjE4IiBjeT0iLTIyIiByeD0iMTYiIHJ5PSIzMSIgZmlsbD0iIzdGQUU4RSIgb3BhY2l0eT0iMC44OCIgdHJhbnNmb3JtPSJyb3RhdGUoMTUgMTggLTIyKSIvPgogICAgICA8ZWxsaXBzZSBjeD0iLTE0IiBjeT0iMTgiIHJ4PSIxNiIgcnk9IjMwIiBmaWxsPSIjOEZDMjlFIiBvcGFjaXR5PSIwLjg4IiB0cmFuc2Zvcm09InJvdGF0ZSgtMTIgLTE0IDE4KSIvPgogICAgICA8ZWxsaXBzZSBjeD0iMTQiIGN5PSIxNiIgcng9IjE2IiByeT0iMzAiIGZpbGw9IiM5QkNCQTgiIG9wYWNpdHk9IjAuODgiIHRyYW5zZm9ybT0icm90YXRlKDEyIDE0IDE2KSIvPgogICAgICA8cmVjdCB4PSItMjIiIHk9IjU2IiB3aWR0aD0iNDQiIGhlaWdodD0iOSIgcng9IjMiIGZpbGw9IiNEOThBNEUiIG9wYWNpdHk9IjAuODUiLz4KICAgICAgPHJlY3QgeD0iLTIyIiB5PSI2OSIgd2lkdGg9IjQ0IiBoZWlnaHQ9IjciIHJ4PSIzIiBmaWxsPSIjRDk4QTRFIiBvcGFjaXR5PSIwLjciLz4KICAgIDwvZz4KICAgIDxnIHN0cm9rZT0iIzVBOEI2QSIgc3Ryb2tlLXdpZHRoPSIxLjQiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMzUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+CiAgICAgIDxwYXRoIGQ9Ik03NCAtNDYgQyA5MiAtMzYgOTYgLTE4IDg4IC0yIi8+PHBhdGggZD0iTS04OCAtMzAgQyAtMTA0IC0xOCAtMTA2IDAgLTk2IDE0Ii8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K",
  },
  {
    id: "PH-03",
    category: "selected",
    name: "手抄祈願筆記本",
    en: "Intention Notebook",
    price: 680,
    stock: 80,
    blurb: "配合顯化筆記使用的空白本，一天一頁。",
    spec: [["頁數", "128 頁"], ["尺寸", "A5"], ["裝訂", "線裝可平攤"]],
    emoji: "📓",
    tint: "#FFF3E4",
    image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIj4KICA8ZGVmcz4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0iYmczIiBjeD0iNTAlIiBjeT0iNDAlIiByPSI3NSUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRkZGOUYwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0ZCRUZEQyIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjYmczKSIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwxNTApIHJvdGF0ZSgtNCkiPgogICAgPHJlY3QgeD0iLTk1IiB5PSItNjgiIHdpZHRoPSIxOTAiIGhlaWdodD0iMTM2IiByeD0iNiIgZmlsbD0iI0YzRTRDOCIgb3BhY2l0eT0iMC45Ii8+CiAgICA8cmVjdCB4PSItODgiIHk9Ii03MiIgd2lkdGg9IjE3NiIgaGVpZ2h0PSIxNDAiIHJ4PSI2IiBmaWxsPSIjRkZGREY3IiBzdHJva2U9IiNFM0M5OUEiIHN0cm9rZS13aWR0aD0iMS41Ii8+CiAgICA8bGluZSB4MT0iLTcwIiB5MT0iLTQyIiB4Mj0iNzAiIHkyPSItNDIiIHN0cm9rZT0iI0U5RDZBRSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgICA8bGluZSB4MT0iLTcwIiB5MT0iLTIwIiB4Mj0iNzAiIHkyPSItMjAiIHN0cm9rZT0iI0U5RDZBRSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgICA8bGluZSB4MT0iLTcwIiB5MT0iMiIgeDI9IjcwIiB5Mj0iMiIgc3Ryb2tlPSIjRTlENkFFIiBzdHJva2Utd2lkdGg9IjIiLz4KICAgIDxsaW5lIHgxPSItNzAiIHkxPSIyNCIgeDI9IjQwIiB5Mj0iMjQiIHN0cm9rZT0iI0U5RDZBRSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgICA8bGluZSB4MT0iLTcwIiB5MT0iNDYiIHgyPSI1NSIgeTI9IjQ2IiBzdHJva2U9IiNFOUQ2QUUiIHN0cm9rZS13aWR0aD0iMiIvPgogICAgPHBhdGggZD0iTSAtODUsLTcyIEwgLTg1LDY4IiBzdHJva2U9IiNEOEI2NzkiIHN0cm9rZS13aWR0aD0iMyIgb3BhY2l0eT0iMC42Ii8+CiAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg1MiwtNTIpIHJvdGF0ZSgxOCkiPgogICAgICA8ZWxsaXBzZSBjeD0iMCIgY3k9IjAiIHJ4PSI1IiByeT0iMTYiIGZpbGw9IiNEOThBNEUiIG9wYWNpdHk9IjAuOCIvPgogICAgICA8ZWxsaXBzZSBjeD0iLTEiIGN5PSIxNCIgcng9IjQiIHJ5PSIxMCIgZmlsbD0iI0IwODU1QyIgb3BhY2l0eT0iMC44NSIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==",
    image2: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIj4KICA8ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImciIGN4PSI1MCUiIGN5PSI0MiUiIHI9IjcyJSI+CiAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNGRkZDRjYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGN0U3Q0UiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNnKSIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwxNTApIj4KICAgIDxnIHRyYW5zZm9ybT0icm90YXRlKC0xNCkgdHJhbnNsYXRlKC04LDYpIj4KICAgICAgPHJlY3QgeD0iLTg0IiB5PSItNTgiIHdpZHRoPSIxNjgiIGhlaWdodD0iMTE4IiByeD0iNiIgZmlsbD0iI0VGREZDMCIgb3BhY2l0eT0iMC44NSIvPgogICAgICA8cmVjdCB4PSItOTAiIHk9Ii02NCIgd2lkdGg9IjE2OCIgaGVpZ2h0PSIxMjAiIHJ4PSI2IiBmaWxsPSIjRkZGREY4IiBzdHJva2U9IiNFM0M5OUEiIHN0cm9rZS13aWR0aD0iMS41Ii8+CiAgICAgIDxwYXRoIGQ9Ik0tOTAgLTY0IEwtOTAgNTYiIHN0cm9rZT0iI0Q4QjY3OSIgc3Ryb2tlLXdpZHRoPSIzIiBvcGFjaXR5PSIwLjYiLz4KICAgICAgPGcgc3Ryb2tlPSIjRTlENkFFIiBzdHJva2Utd2lkdGg9IjIiPgogICAgICAgIDxsaW5lIHgxPSItNzIiIHkxPSItMzQiIHgyPSI2MCIgeTI9Ii0zNCIvPjxsaW5lIHgxPSItNzIiIHkxPSItMTIiIHgyPSI2MCIgeTI9Ii0xMiIvPgogICAgICAgIDxsaW5lIHgxPSItNzIiIHkxPSIxMCIgeDI9IjM0IiB5Mj0iMTAiLz48bGluZSB4MT0iLTcyIiB5MT0iMzIiIHgyPSI0OCIgeTI9IjMyIi8+CiAgICAgIDwvZz4KICAgIDwvZz4KICAgIDxnIHRyYW5zZm9ybT0icm90YXRlKDI0KSB0cmFuc2xhdGUoNjYsLTMwKSI+CiAgICAgIDxlbGxpcHNlIGN4PSIwIiBjeT0iMCIgcng9IjYiIHJ5PSIyMCIgZmlsbD0iI0Q5OEE0RSIgb3BhY2l0eT0iMC44NSIvPgogICAgICA8ZWxsaXBzZSBjeD0iLTEiIGN5PSIxNyIgcng9IjQuNSIgcnk9IjEyIiBmaWxsPSIjQjA4NTVDIiBvcGFjaXR5PSIwLjkiLz4KICAgICAgPGxpbmUgeDE9IjAiIHkxPSItMjAiIHgyPSIwIiB5Mj0iLTM4IiBzdHJva2U9IiNCMDg1NUMiIHN0cm9rZS13aWR0aD0iMi41IiBvcGFjaXR5PSIwLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==",
  },
];

function load() {
  if (!fs.existsSync(FILE)) {
    save(SEED);
    return SEED;
  }
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    console.error("products.json 壞掉了，回退成種子資料");
    save(SEED);
    return SEED;
  }
}

function save(list) {
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf8");
}

let products = load();

/**
 * 把 base64 圖片存成真正的檔案，回傳可以直接放進商品資料的路徑。
 * 如果傳進來的已經是路徑（沒改圖片、編輯時原樣傳回）就直接沿用，不重存。
 * 丟 Error 的話上層要接住，轉成一般的驗證錯誤訊息回給前端。
 */
function saveImageIfNeeded(image, productId, suffix = "") {
  if (!image) return null;
  if (!image.startsWith("data:image/")) return image; // 已經是路徑，沒有換圖

  const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) throw new Error("圖片格式看不懂，請重新選一張");

  const [, ext, b64] = match;
  const buffer = Buffer.from(b64, "base64");
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("圖片太大了，請壓縮到 5MB 以內");
  }

  const filename = `${productId}${suffix}-${Date.now()}.${ext === "jpeg" ? "jpg" : ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

function deleteImageFile(imagePath) {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  const full = path.join(UPLOADS_DIR, path.basename(imagePath));
  fs.unlink(full, () => {}); // 刪不掉也沒關係，不影響商品資料本身
}

export function list() {
  return products;
}

export function get(id) {
  return products.find((p) => p.id === id);
}

function slugId(name) {
  const base = "PH-" + Date.now().toString(36).toUpperCase();
  return base;
}

export function create(input) {
  const errors = validate(input);
  if (errors.length) return { error: errors.join("；") };

  const id = input.id?.trim() || slugId(input.name);

  if (products.some((p) => p.id === id)) {
    return { error: "這個商品編號已經用過了。" };
  }

  let image, image2;
  try {
    image = saveImageIfNeeded(input.image, id);
    // 第二張圖是 hover 時要換上去的，沒有就 null，卡片會退回單張行為
    image2 = saveImageIfNeeded(input.image2, id, "-b");
  } catch (e) {
    return { error: e.message };
  }

  const item = {
    id,
    name: input.name.trim(),
    en: (input.en || "").trim(),
    price: Number(input.price),
    stock: Number(input.stock ?? 0),
    blurb: (input.blurb || "").trim(),
    spec: Array.isArray(input.spec) ? input.spec.filter((r) => r[0] && r[1]) : [],
    emoji: input.emoji?.trim() || "✦",
    tint: input.tint?.trim() || "#F3EDF9",
    category: input.category || "crystal",
    image,
    image2,
  };

  products = [...products, item];
  save(products);
  return { item };
}

export function update(id, input) {
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return { error: "找不到這個商品。" };

  const errors = validate({ ...products[idx], ...input });
  if (errors.length) return { error: errors.join("；") };

  let image = products[idx].image;
  if (input.image !== undefined) {
    try {
      const saved = saveImageIfNeeded(input.image, id);
      // 換了新圖才刪舊檔，舊圖路徑沒變（等於沒換圖）就不動它
      if (saved !== products[idx].image && products[idx].image) {
        deleteImageFile(products[idx].image);
      }
      image = saved;
    } catch (e) {
      return { error: e.message };
    }
  }

  let image2 = products[idx].image2;
  if (input.image2 !== undefined) {
    try {
      const saved = saveImageIfNeeded(input.image2, id, "-b");
      if (saved !== products[idx].image2 && products[idx].image2) {
        deleteImageFile(products[idx].image2);
      }
      image2 = saved;
    } catch (e) {
      return { error: e.message };
    }
  }

  const item = {
    ...products[idx],
    ...input,
    price: Number(input.price ?? products[idx].price),
    stock: Number(input.stock ?? products[idx].stock),
    image,
    image2,
  };
  products = products.map((p) => (p.id === id ? item : p));
  save(products);
  return { item };
}

export function remove(id) {
  const target = products.find((p) => p.id === id);
  const before = products.length;
  products = products.filter((p) => p.id !== id);
  if (products.length === before) return { error: "找不到這個商品。" };
  if (target?.image) deleteImageFile(target.image);
  if (target?.image2) deleteImageFile(target.image2);
  save(products);
  return { ok: true };
}

function validate(input) {
  const errors = [];
  if (!input.name || !input.name.trim()) errors.push("名稱不能空白");
  if (!(Number(input.price) > 0)) errors.push("價格要大於 0");
  if (input.stock != null && Number(input.stock) < 0) errors.push("庫存不能是負數");
  return errors;
}
