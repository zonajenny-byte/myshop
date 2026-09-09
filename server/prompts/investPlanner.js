/**
 * 月加薪投資器（AP-SL-23）
 *
 * 重要的設計決定：**數字由程式算，不交給 AI 算。**
 *
 * 複利是精確數學，AI 算數字有出錯的風險，而且這裡算錯會直接誤導財務決定。
 * 所以流程是：程式先算出所有數字 → 把算好的數字餵給 AI → AI 只負責「解讀」。
 * AI 不需要、也不應該自己做任何算術。
 *
 * 輸出格式要跟前端 src/tools/Result.jsx 的 InvestResult 對齊。
 */

/** 期末年金終值：每月投入、月複利。這是標準公式，不是估算。 */
function futureValue(monthly, annualRatePct, years) {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthly * n; // 報酬率 0 就是單純累加，避免除以零
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

const round = (v) => Math.round(v);

/**
 * 把所有數字算好。回傳的東西直接就是前端要的結構，
 * AI 只會往裡面補 observations 跟 inflation.note 這兩個「解讀」欄位。
 */
export function compute({ monthly, years, rate }) {
  const m = Number(monthly) || 0;
  const y = Number(years) || 0;
  const baseRate = Number(rate) || 0;

  const principal = m * y * 12;

  // 三情境：使用者填的假設，加上下各一檔。下限不低於 0（負報酬的長期定期定額試算沒有意義）
  const pessimistic = Math.max(0, baseRate - 4);
  const optimistic = baseRate + 3;

  const mk = (label, pct, primary = false) => {
    const value = round(futureValue(m, pct, y));
    return { label, rate: Number(pct.toFixed(1)), value, gain: value - principal, ...(primary ? { primary: true } : {}) };
  };

  const scenarios = [
    mk("悲觀", pessimistic),
    mk("你填的假設", baseRate, true),
    mk("樂觀", optimistic),
  ];

  const primaryValue = scenarios[1].value;

  // 通膨用 2% 這個常見的長期假設，把帳面數字折回現在的購買力
  const INFLATION = 2;
  const realValue = round(primaryValue / Math.pow(1 + INFLATION / 100, y));

  // 過程中的幾個時間點，讓人看到複利是後段才明顯
  const marks = [...new Set([3, 5, 10, y].filter((k) => k > 0 && k <= y))].sort((a, b) => a - b);
  const milestones = marks.map((k) => ({
    year: k,
    principal: m * k * 12,
    value: round(futureValue(m, baseRate, k)),
  }));

  // 給 AI 當解讀素材用的幾個比例，一樣由程式算好
  const gainShare = primaryValue > 0 ? Math.round((scenarios[1].gain / primaryValue) * 100) : 0;
  const spread = scenarios[2].value - scenarios[0].value;
  const plus2000 = round(futureValue(m + 2000, baseRate, y)) - primaryValue;

  return {
    inputs: { monthly: m, years: y, rate: baseRate },
    principal,
    scenarios,
    inflation: { rate: INFLATION, realValue },
    milestones,
    // 這幾個數字是要給 AI 寫觀察用的，前端不直接顯示
    _facts: { gainShare, principalShare: 100 - gainShare, spread, plus2000 },
  };
}

export const SYSTEM_PROMPT = `你是「月加薪投資器」，AuraPlayground 平台上的其中一顆生活 AI 工具。使用者做了一份定期定額試算，**所有數字都已經算好了**，你的工作只有一個：把這些數字解讀成他看得懂、用得上的話。

# 絕對不能違反的界線
- **不要自己做任何算術。** 數字都算好了，你只負責解讀。要引用數字就直接用給你的那些，不要自己乘除。
- **不推薦任何標的。** 不提任何 ETF、基金、股票、平台的名字。使用者沒有問你要買什麼，你也不該回答。
- **不預測市場。** 報酬率是使用者自己填的假設值，不是預測。不要說「以歷史經驗這個報酬率很合理」或「市場長期會怎樣」。
- **不能講得像在保證。** 不要寫「十年後你就有 X 元」，要寫「如果報酬率真的是 X%，帳面上會是 X 元」。這兩句的差別很重要。
- **必須讓風險看得見。** 悲觀情境不是拿來襯托樂觀的，那是真的可能發生的事。
- 不做稅務、法律建議。不評論使用者的財務狀況好不好、存得夠不夠多。

# 語氣
像一個誠實的朋友幫你看試算表，不是理專在推銷。可以講白話、可以講實話（例如「前幾年複利感覺不出來，主要是靠你自己存」），但不要說教，也不要嚇人。

# 輸出格式
只能輸出一個 JSON 物件，不要任何其他文字、不要 markdown code fence（不要用 \`\`\`）。

{
  "inflationNote": "兩到三句話，解釋通膨調整後的數字意義。要講清楚「帳面數字」跟「實際購買力」的差別，用給你的那兩個數字說明",
  "observations": [
    "三到四條觀察。每一條都要用到給你的具體數字，不要講空泛的道理。",
    "至少要有一條講「本金佔比 vs 報酬佔比」的意義。",
    "至少要有一條講悲觀與樂觀之間的落差代表什麼——那是風險的實際大小。"
  ]
}`;

export function buildUserContent({ computed, fields }) {
  const f = computed._facts;
  const s = computed.scenarios;
  const goal = fields?.goal;

  return `以下是已經算好的試算結果，請幫我解讀。所有數字都算好了，不要自己重算。

每月投入：${computed.inputs.monthly} 元
投資期間：${computed.inputs.years} 年
假設年報酬率：${computed.inputs.rate}%
${goal ? `目標：${goal}` : ""}

累積投入本金：${computed.principal} 元

三種情境的期末帳面價值：
- 悲觀（${s[0].rate}%）：${s[0].value} 元，其中報酬 ${s[0].gain} 元
- 你填的假設（${s[1].rate}%）：${s[1].value} 元，其中報酬 ${s[1].gain} 元
- 樂觀（${s[2].rate}%）：${s[2].value} 元，其中報酬 ${s[2].gain} 元

通膨調整（假設年通膨 ${computed.inflation.rate}%）：
帳面 ${s[1].value} 元，換算成現在的購買力約 ${computed.inflation.realValue} 元

其他已算好的事實：
- 期末價值裡有 ${f.gainShare}% 來自報酬、${f.principalShare}% 來自本金
- 悲觀與樂觀之間相差 ${f.spread} 元
- 如果每月多投 2000 元，期末會多 ${f.plus2000} 元`;
}

/** 前端要顯示的固定風險說明。這幾條不交給 AI 生成，避免它漏寫或改寫得太輕描淡寫。 */
export const FIXED_NOTES = [
  "這是純數學試算，報酬率是你自己填的假設值，不是預測。",
  "實際投資有虧損本金的可能，過去績效不代表未來表現。",
  "沒有計入手續費、稅負、匯率變動，實際結果會更低一些。",
  "不推薦任何標的。要做決定前請諮詢合格的理財顧問。",
];
