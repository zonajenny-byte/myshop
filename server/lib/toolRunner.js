/**
 * 工具的執行入口。已接 Anthropic API：食安標示解讀器、下班的緩衝、
 * 個人風格規劃、自媒體爆款短片生成器、月加薪投資器。
 * 其餘還沒寫 prompt——TOOLS 裡沒有對應項目的話，
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
import * as stylePlanning from "../prompts/stylePlanning.js";
import * as videoScript from "../prompts/videoScript.js";
import * as investPlanner from "../prompts/investPlanner.js";

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

async function runStylePlanning({ fields }) {
  if (!fields?.wardrobe?.trim()) throw new Error("先告訴我你衣櫃裡有什麼。");
  const text = await callClaude({
    system: stylePlanning.SYSTEM_PROMPT,
    messages: [{ role: "user", content: stylePlanning.buildUserContent({ fields }) }],
    maxTokens: 2000,
  });
  return { result: extractJson(text), chargeCredit: true };
}

async function runVideoScript({ fields }) {
  if (!fields?.topic?.trim()) throw new Error("先告訴我這支想拍什麼。");
  const text = await callClaude({
    system: videoScript.SYSTEM_PROMPT,
    messages: [{ role: "user", content: videoScript.buildUserContent({ fields }) }],
    maxTokens: 2200,
  });
  return { result: extractJson(text), chargeCredit: true };
}

async function runInvestPlanner({ fields }) {
  const monthly = Number(fields?.monthly);
  const years = Number(fields?.years);
  const rate = Number(fields?.rate);
  if (!(monthly > 0)) throw new Error("每月投入金額要大於 0。");
  if (!(years > 0)) throw new Error("投資年數要大於 0。");
  if (!(rate >= 0)) throw new Error("報酬率不能是負數。");
  if (years > 60) throw new Error("年數請填 60 以內。");

  // 數字由程式算，AI 只負責解讀——複利算錯會直接誤導財務決定，不能交給模型
  const computed = investPlanner.compute({ monthly, years, rate });

  const text = await callClaude({
    system: investPlanner.SYSTEM_PROMPT,
    messages: [{ role: "user", content: investPlanner.buildUserContent({ computed, fields }) }],
    maxTokens: 1200,
  });
  const interpreted = extractJson(text);

  // 把 AI 的解讀併回算好的數字。_facts 是給 AI 用的素材，不回傳前端。
  const { _facts, ...rest } = computed;
  return {
    result: {
      ...rest,
      inflation: { ...rest.inflation, note: interpreted.inflationNote || "" },
      observations: Array.isArray(interpreted.observations) ? interpreted.observations : [],
      // 風險說明固定寫死，不讓 AI 改寫或漏寫
      notes: investPlanner.FIXED_NOTES,
    },
    chargeCredit: true,
  };
}

export const TOOLS = {
  "label-reader": runLabelReader,
  "commute-decompress": runCommuteDecompress,
  "style-planning": runStylePlanning,
  "viral-video-script": runVideoScript,
  "invest-planner": runInvestPlanner,
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
  "gift-etiquette": "AP-SL-19",
  "style-planning": "AP-SL-20",
  "startup-basics": "AP-SL-21",
  "viral-video-script": "AP-SL-22",
  "invest-planner": "AP-SL-23",
};
