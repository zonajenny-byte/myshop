/**
 * 預覽模式的假資料。
 * 設定了 VITE_API_BASE 之後就不會用到這支，可以整個刪掉。
 */
export function demoResult(tool, payload) {
  if (tool === "commute-decompress") {
    const hist = payload.history || [];
    const turns = hist.filter((h) => h.role === "user").length + 1;
    const last = payload.fields?.today || "";
    if (/撐不下去|撐不住|不想活|沒有意義|消失|解脫|沒有價值|拖累/.test(last)) {
      return {
        reply: "等一下，我想先停一下。你剛剛講的那個，已經超過「下班放不下工作」的範圍了。",
        stop_flow: true, done: false, tomorrow: [], closing: null,
        concern: "每天收尾這種工具幫不上這個忙，跟心理師或身心科談會比較有用。",
      };
    }
    if (turns === 1) return { reply: "今天聽起來很長。\n\n先問一件事：今天有沒有哪件事，其實是做完的？", done: false };
    if (turns === 2) return { reply: "那就是做完了。做完的部分不會因為後面發生什麼就不算。\n\n那現在還在你腦裡轉的是哪一件？", done: false };
    if (turns === 3) return { reply: "這種最難放，因為現在做什麼都沒用，只能一直重播。\n\n這件事今天還能做什麼嗎？", done: false };
    return {
      reply: "那今天到這裡就好了。我幫你記著。", done: true,
      tomorrow: ["早上先把來往紀錄找出來", "再決定要不要跟他確認一次"],
      closing: "今天到這裡。",
    };
  }
  return DEMO[tool];
}

const DEMO = {
  "label-reader": {
    readable: true, product_name: "蔬菜風味蘇打餅乾",
    what_it_is: "依成分排序，這主要是小麥粉加棕櫚油與糖做的餅乾，成分表裡沒有任何蔬菜原料。",
    allergen_hits: ["大豆"],
    flags: {
      red: [
        { title: "命中你的忌口清單：大豆", detail: "成分中的「大豆卵磷脂」是大豆製品，屬台灣強制標示 11 項過敏原之一。用途是乳化劑。" },
        { title: "「蔬菜風味」但沒有蔬菜", detail: "成分表沒有任何蔬菜原料，風味來自「香料」。用「風味」二字合法，但容易誤解。" },
        { title: "有交叉污染警語", detail: "生產線同時處理含牛奶、蛋之產品。配方沒加，但製程可能混入微量。" },
      ],
      yellow: [{ title: "香料可以依法統稱", detail: "台灣允許「香料」不逐項列出，看不出實際用了什麼。" }],
      green: [{ title: "添加物單純", detail: "只有大豆卵磷脂與碳酸氫鈉兩項，用途明確。" }],
    },
    ingredients: [
      { name: "大豆卵磷脂", what: "乳化劑，從大豆萃取", why: "讓油脂與麵團均勻混合。同時是強制標示過敏原。" },
      { name: "碳酸氫鈉", what: "膨脹劑，小蘇打", why: "受熱產生二氧化碳讓餅乾膨鬆。" },
    ],
    nutrition: {
      available: true,
      rows: [
        { label: "熱量", per_100: "498 大卡", whole_pack: "478 大卡", pct_daily: 24 },
        { label: "飽和脂肪", per_100: "9.6 g", whole_pack: "9.2 g", pct_daily: 51 },
        { label: "糖", per_100: "12.5 g", whole_pack: "12 g", pct_daily: null },
      ],
      notes: ["標示以每份 24 公克為基準，整包含 4 份。多數人一次吃完整包。"],
    },
    one_line: "如果你避開大豆，這包要跳過。另外它叫蔬菜風味但沒有蔬菜。",
  },

  "skincare-reader": {
    readable: true, product_name: "某品牌 B5 修護精華　30ml / NT$1,680",
    base: "前五名是水、丁二醇、甘油、泛醇、菸鹼醯胺——水性精華的標準基底，泛醇排第四算高的。",
    boundary: { index: 9, ingredient: "Phenoxyethanol 苯氧乙醇",
      note: "第 9 項之後全部都在 1% 以下。台灣規定成分依含量排序，但 1% 以下可任意排——後面的順序不代表含量高低。" },
    actives: [
      { name: "Panthenol 泛醇（B5）", position: 4, after_boundary: false, typical: "一般討論 1–5%", verdict: "排在分界線前，推估在有感範圍內。這罐的主力就是它。" },
      { name: "Niacinamide 菸鹼醯胺", position: 5, after_boundary: false, typical: "一般討論 2–5%", verdict: "卡在分界線前，推估 1% 以上但無法確認到幾 %。" },
      { name: "Sodium Hyaluronate 玻尿酸鈉", position: 13, after_boundary: true, typical: "低濃度即足夠", verdict: "在線後很正常，這類成分本來就不需要高濃度。不是偷工減料。" },
    ],
    notes: [{ title: "Cetearyl Alcohol 不是酒精", detail: "它是脂肪醇，作用是乳化增稠。跟包裝寫的「不含酒精」不衝突。" }],
    conflicts: [{ title: "跟你的 A 醇晚霜", detail: "這罐溫和，可以跟視黃醇搭。不過視黃醇建議晚上用、白天確實防曬。" }],
    claims: [
      { text: "修護受損肌", issue: "讀起來接近醫療效能的宣稱，一般化粧品不能這樣講。多半是文案沒送法規審過。" },
      { text: "淡化細紋", issue: null },
    ],
    unit_price: { per_ml: 56.0, days: 38, per_day: 44.8 },
    one_line: "這罐的主力是泛醇，不是包裝主打的菸鹼醯胺。為了修護保濕買的，位置對；為了美白買的，可能要看別的。",
  },

  "hard-talk": {
    safe: true,
    want: "你要的是「一個結果」——訊息減少或至少不用即時回。這類講法要具體、可執行。",
    options: {
      A: { kind: "留關係型", tradeoff_label: "保住關係",
        script: "主管，有件事想跟你說一下。晚上的訊息我常常沒看到，怕漏掉重要的事。以後六點後的訊息我會隔天一早第一件處理，如果是急的你直接打給我。",
        tradeoff: "換到：拿到緩衝，關係不受損。犧牲：對方可能還是會傳，只是你不用馬上回。" },
      B: { kind: "拿結果型", tradeoff_label: "要結果",
        script: "我想跟你確認一下工作時間的界線。六點之後我不會看訊息，有急事請直接打電話。這樣我白天的專注度也會比較好。",
        tradeoff: "換到：界線最清楚。犧牲：對方可能不太高興，短期氣氛會有點僵。" },
      C: { kind: "留退路型", tradeoff_label: "先試水溫",
        script: "最近晚上訊息有點多，我在想是不是有些可以白天一起處理會比較有效率？你覺得呢？",
        tradeoff: "換到：風險最低，先看對方反應。犧牲：可能沒有結果，之後還要再談一次。" },
    },
    replies: [
      { them: "我只是想到就傳，你不用馬上回啊", you: "了解，那我就隔天一早處理。你不介意的話我就這樣安排。",
        why: "這是最好的回應，立刻把它變成明確共識，不要只是笑一笑帶過。" },
      { them: "這個工作性質就是這樣", you: "我理解有時候真的急。我想確認的是哪些算急，這樣我才知道要不要馬上處理。",
        why: "不要跟他辯工作性質，把問題拉到「怎麼分辨急件」，這是他答得出來的。" },
      { them: "（沉默，或看起來不太高興）", you: "我不是不配合，是想把時間花在對的地方。真的有急事我一定接。",
        why: "沉默三秒是正常的，他在消化。不要急著補充，補充會把立場講糊。" },
    ],
    closing: "謝謝你聽我講，我先照這樣試試看，有問題我們再調整。",
    after: "講完之後可能會一直重播剛剛的每一句話。對方當天的狀態、他自己的壓力都會影響反應，那些不是你講得好不好造成的。",
  },

  "big-decision": {
    opening_question: "如果現在有人跟你說「這件事三個月後再決定就好」，你會鬆一口氣，還是更焦慮？鬆一口氣的話，這可能是累，不是決定。",
    questions: [
      "現在這份工作最讓你受不了的，具體是哪件事？（要能講出一個場景）",
      "那件事有機會改變嗎？你試過哪些方法？",
      "你離開之後，最實際的下一步是什麼？",
      "你撐得起多久沒有收入？",
      "你在怕的是錢、面子，還是能力？",
    ],
    reversibility: { kind: "可逆",
      detail: "換工作在多數情況下可以回頭，代價是時間和一點面子。既然可逆，猶豫一年的成本比做錯還高——早點決定，早點知道對不對。" },
    worst_cases: [
      { fear: "找不到下一份工作", if_real: "失業六個月", you_can: "存款撐得住 8 個月，第四個月起降低期待" },
      { fear: "家人失望", if_real: "過年被問、被念", you_can: "準備好講法，念完還是我的人生" },
      { fear: "證明我不行", if_real: "心裡難受一陣子", you_can: "這個沒有實質後果" },
    ],
    info: {
      check: ["同職級薪資行情", "資遣費與失業給付資格", "年終發放的在職條件"],
      try: ["面試兩家，不承諾", "跟主管談一次分工", "週末先接一個小案子"],
      stop: ["產業五年後會怎樣", "離開後會不會後悔", "別人會怎麼看我"],
    },
    checkpoint: { date: "10 / 15",
      actions: ["查：同職級的市場行情、公司的資遣費規定", "試：面試兩家，不承諾", "談：跟主管談一次調整分工的可能"] },
  },

  "purchase-pause": {
    out_of_scope: false, item: "降噪無線耳機", price: 3980, type: "升級型",
    type_note: "你已經有能用的耳機，想換更好的。這類的重點問題是：現在這個實際上哪裡不夠用？",
    numbers: [
      { value: "12.5", unit: "小時工時（約 1.6 個工作天）" },
      { value: "8.3", unit: "元／每次使用" },
      { value: "166", unit: "元／攤到每個月" },
      { value: "61", unit: "杯手搖" },
    ],
    questions: [
      { q: "這個要解決什麼問題？", a: "通勤時同事講話聽不清楚、開會被環境音干擾——說得出具體場景，這題過關。" },
      { q: "一個月後才拿到還想要嗎？", a: "你說猶豫兩週了，不是十分鐘前才知道有這東西。這題也過關。" },
    ],
    tactic: "頁面寫「限時最後一天」，不過這家上個月同款也是這個折數。如果不是現在買會失去什麼，多半沒有——但你本來就想買，這點不影響。",
    verdict: { kind: "go", label: "買吧", detail: "用兩年、每天用，每次成本 8.3 元。你想清楚了，去買。" },
  },

  "home-buying": {
    price: 12000000, loan: 9600000, down_payment: 2400000,
    fees: [
      { name: "契稅", amount: 72000, note: "依房屋評定現值計算，這裡以房價粗估" },
      { name: "印花稅", amount: 12000, note: "依契約金額比例" },
      { name: "代書費與地政規費", amount: 24000, note: "簽約、過戶、設定" },
      { name: "履約保證費", amount: 7200, note: "買賣雙方常見各半" },
      { name: "貸款開辦與鑑價", amount: 12000, note: "各行不同" },
      { name: "火險地震險", amount: 4800, note: "貸款銀行通常要求" },
      { name: "仲介服務費", amount: 240000, note: "以 2% 估，可談" },
      { name: "裝潢家電搬遷", amount: 800000, note: "最容易被忘記的一塊" },
    ],
    fee_total: 1172000, cash_needed: 3572000,
    monthly: { rate: 2.2, amount: 36451, burden: 40.5 },
    stress: { rate: 4.2, amount: 46946, burden: 52.2, delta: 10495 },
    grace: { years: 3, during: 17600, after: 39322, jump_pct: 123 },
    reserve_6m: 218706,
    verdict: "月付佔收入 40.5%，已經偏高。利率升到 4.2% 會變成 52.2%，那個數字會明顯壓縮生活。這不是說不能買，是說你要先確定升息時撐得住。",
    inspection: [
      "雨天去看一次——這是最有效的一招，晴天看不出漏水",
      "天花板、牆角、窗邊有沒有水漬或壁癌",
      "調建物謄本，看有無他項權利與限制登記",
      "實價登錄查同社區成交價，注意車位價是否含在內",
    ],
    contract: [
      { title: "貸款不足額的處理", detail: "最常出事的一條。預期貸八成、實際只核到七成，差額 120 萬要立刻拿出來。要爭取「核貸不足一定成數時買方得無條件解約」。" },
      { title: "履約保證", detail: "價金由第三方保管，一定要確認有。不要在沒有履約保證的情況下先付大筆款項給個人。" },
      { title: "審閱期", detail: "預售屋定型化契約規定至少五日。被催「今天不簽就沒了」就是警訊。" },
    ],
    notes: [
      "稅費為粗估，實際依縣市、契約價與個案而異，簽約前請地政士試算。",
      "核貸成數與利率由銀行決定，因個人條件差異很大。",
      "這只是負擔能力試算，不預測房價、不構成投資或法律建議。",
    ],
  },
};
