/**
 * 七顆工具的執行入口。目前接了 Anthropic API 的有食安標示解讀器跟
 * 下班的緩衝，其餘五顆還沒寫 prompt——TOOLS 裡沒有對應項目的話，
 * /v1/tool/run 會回 501 not_implemented，不是壞掉，是還沒做到那顆。
 *
 * 每個工具函式回傳 { result, chargeCredit }：
 *   result       要回給前端的判讀結果
 *   chargeCredit 這次要不要扣使用者一次額度
 * 多數情況 chargeCredit 是 true。例外是下班的緩衝命中危機關鍵字被攔下來時，
 * 那時候沒有真的呼叫 AI 做事，不該扣使用者的額度。
 *
 * 加新工具的做法：在 prompts/ 底下新增一支檔案（照 labelReader.js 的形狀），
 * 在這裡的 TOOLS 註冊一個 async function (payload) => { result, chargeCredit }，
 * 就串起來了。
 */
import { callClaude, extractJson, isConfigured } from "./anthropic.js";
import { detectCrisis, crisisResponse } from "./safety.js";
import * as labelReader from "../prompts/labelReader.js";
import * as commuteDecompress from "../prompts/commuteDecompress.js";

export { isConfigured };

async function runLabelReader({ image, mediaType, context }) {
  if (!image) throw new Error("需要一張成分表照片。");

  const text = await callClaude({
    system: labelReader.SYSTEM_PROMPT,
    messages: [{ role: "user", content: labelReader.buildUserContent({ image, mediaType, context }) }],
  });

  return { result: extractJson(text), chargeCredit: true };
}

async function runCommuteDecompress({ fields, history }) {
  const today = fields?.today || "";
  if (!today.trim()) throw new Error("沒有收到你剛剛講的話。");

  // 第一層安全網：關鍵字快速攔截，不用等模型判斷，AI 服務掛掉或逾時也一樣攔得住
  if (detectCrisis(today)) {
    return {
      result: crisisResponse(
        "等一下，我想先停一下。你剛剛講的那個，已經超過「下班放不下工作」的範圍了。",
        "每天收尾這種工具幫不上這個忙，跟心理師或身心科談會比較有用。"
      ),
      chargeCredit: false, // 沒有真的呼叫 AI 做事，不扣額度
    };
  }

  const messages = commuteDecompress.buildMessages({ history, today });
  const text = await callClaude({
    system: commuteDecompress.SYSTEM_PROMPT,
    messages,
    maxTokens: 800, // 這顆每輪回應都很短，不用給太多 token 預算
  });

  const result = extractJson(text);

  // 第二層安全網：就算模型自己判斷出該停下（system prompt 裡有交代），
  // 那一輪同樣不扣額度——使用者在講需要專業協助的事，不該還要付錢
  const chargeCredit = !result.stop_flow;
  return { result, chargeCredit };
}

export const TOOLS = {
  "label-reader": runLabelReader,
  "commute-decompress": runCommuteDecompress,
  // "skincare-reader": ...,  尚未實作
  // "hard-talk": ...,
  // "big-decision": ...,
  // "purchase-pause": ...,
  // "home-buying": ...,
};

/** 工具鍵值對應到購買時的商品 ID，權益檢查要用這個 */
export const SKILL_ID_MAP = {
  "label-reader": "AP-SL-01",
  "skincare-reader": "AP-SL-09",
  "hard-talk": "AP-SL-06",
  "big-decision": "AP-SL-07",
  "purchase-pause": "AP-SL-08",
  "commute-decompress": "AP-SL-13",
  "home-buying": "AP-SL-16",
};
