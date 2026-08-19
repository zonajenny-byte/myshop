/**
 * 呼叫 Anthropic API，直接用 fetch，不拉 SDK 進來——
 * 整個後端目前只有一種呼叫模式（單輪、要 JSON 結果），沒必要為此加一個套件依賴。
 *
 * 模型選 Sonnet：這幾顆工具有的碰過敏原、財務數字這類讀錯會有實際後果的內容，
 * 精準度比省那幾毛錢重要。真的要壓成本，改 ANTHROPIC_MODEL 環境變數換成
 * Haiku 系列即可，程式碼不用動。
 */
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export function isConfigured() {
  return !!API_KEY;
}

/**
 * messages: Anthropic Messages API 格式的 messages 陣列
 * 回傳純文字（把所有 text block 接起來），呼叫端自己負責解析裡面的 JSON
 */
export async function callClaude({ system, messages, maxTokens = 2500 }) {
  if (!API_KEY) throw new Error("ANTHROPIC_API_KEY 沒有設定");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic API 回應錯誤（${res.status}）：${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/**
 * 從模型回應裡挖出 JSON。就算 prompt 已經要求「只回 JSON」，
 * 模型偶爾還是會包一層 markdown code fence或多講幾句話，這裡做防呆。
 */
export function extractJson(text) {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 沒有回傳可解析的 JSON 結果");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}
