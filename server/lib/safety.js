/**
 * 危機訊號的關鍵字快速攔截。
 *
 * 這是安全機制的第一層：不用等模型判斷，命中就立刻攔下來，
 * 不會因為模型逾時、模型判斷失準、或 AI 服務掛掉而漏接。
 * 第二層是各工具自己的 system prompt 裡會再交代模型自己留意
 * 沒有命中關鍵字、但語意上同樣透露危機的說法（例如換句話說的輕生念頭）。
 *
 * 關鍵字刻意保守：寧可漏接語意隱晦的情況（交給模型那層去接），
 * 也不要因為太寬鬆而在使用者只是抱怨「壓力好大」的時候誤判。
 */
const CRISIS_PATTERN =
  /自殺|想死|不想活|活不下去|撐不下去|撐不住|沒有意義|消失|解脫|沒有價值|拖累|傷害自己|自殘|割腕|結束生命|生無可戀/;

export function detectCrisis(text) {
  if (!text) return false;
  return CRISIS_PATTERN.test(text);
}

/** 統一的危機回應格式，各工具的安全轉導都用這個形狀 */
export function crisisResponse(replyIntro, concern) {
  return {
    reply: replyIntro,
    stop_flow: true,
    done: false,
    tomorrow: [],
    closing: null,
    concern,
  };
}
