/**
 * 商品目錄
 *
 * kind: "physical" 需要收件地址、要算運費、有庫存
 *       "digital"  買完直接開通工具台權限，不需地址
 *
 * PHYSICAL 這份是「種子資料」，只在第一次啟動（或 DEMO 模式沒有本機資料時）當預設值。
 * 之後要上新商品，去 /admin 後台加，不用回來改這個檔案。
 * 實際會顯示給使用者的清單，來自 src/lib/products.js。
 */

export const PHYSICAL = [
  {
    id: "PH-01",
    kind: "physical",
    name: "月相手鍊",
    en: "Moon Phase Bracelet",
    price: 1280,
    stock: 50,
    blurb: "月光石與黃銅，隨光線變換色澤。",
    desc: "手工串製，每條的月光石紋理都不一樣。附絨布收納袋與保養說明卡。",
    spec: [["材質", "月光石、黃銅"], ["長度", "16–19cm 可調"], ["出貨", "3–5 個工作天"]],
    emoji: "🌙",
    tint: "#F3EDF9",
  },
  {
    id: "PH-02",
    kind: "physical",
    name: "淨化白鼠尾草",
    en: "White Sage Bundle",
    price: 480,
    stock: 120,
    blurb: "淨化空間用，一束約可使用二十次。",
    desc: "加州產白鼠尾草，自然風乾綑紮。使用時請保持通風，並準備耐熱容器。",
    spec: [["產地", "加州"], ["長度", "約 10cm"], ["注意", "使用時務必通風"]],
    emoji: "🌿",
    tint: "#E7F7F0",
  },
  {
    id: "PH-03",
    kind: "physical",
    name: "手抄祈願筆記本",
    en: "Intention Notebook",
    price: 680,
    stock: 80,
    blurb: "配合顯化筆記使用的空白本，一天一頁。",
    desc: "米色道林紙，可平攤書寫。內頁印有淡色格線與日期欄，其餘留白。",
    spec: [["頁數", "128 頁"], ["尺寸", "A5"], ["裝訂", "線裝可平攤"]],
    emoji: "📓",
    tint: "#FFF3E4",
  },
];

export const SKILLS = [
  {
    id: "AP-SL-01",
    kind: "digital",
    toolKey: "label-reader",
    name: "食安標示解讀器",
    en: "Food Label Reader",
    price: 850,
    blurb: "拍下成分表，三十秒看懂你吃進了什麼。",
    feat: [
      "逐項拆解添加物用途，標出常見爭議項目",
      "過敏原與你設定的忌口清單自動比對",
      "抓出「無添加」「零反式脂肪」這類標示的實際含意",
    ],
    limit: "依標示與公開資料判讀，不是實驗室檢驗，無法驗出殘留、污染或標示不實。",
    emoji: "🥐",
    tint: "#FFE8EF",
  },
  {
    id: "AP-SL-09",
    kind: "digital",
    toolKey: "skincare-reader",
    name: "保養品成分解讀",
    en: "Skincare Label Reader",
    price: 850,
    blurb: "看懂這罐到底在做什麼、值不值這個價。",
    feat: [
      "標出 1% 分界線，明星成分實際排第幾位一目了然",
      "跟你正在用的其他罐比對，找出重複或會打架的",
      "換算每毫升單價，大罐小罐哪個划算",
    ],
    limit: "依標示判讀成分與宣稱，不是效果評估，也不是皮膚科診斷。",
    emoji: "🧴",
    tint: "#FFEDE6",
  },
  {
    id: "AP-SL-06",
    kind: "digital",
    toolKey: "hard-talk",
    name: "難開口的對話",
    en: "Hard Talk Rehearsal",
    price: 850,
    blurb: "那句一直沒說出口的話，先在這裡練一次。",
    feat: [
      "拒絕、談加薪、設界線，各給你三種講法",
      "先演一次對方可能的反應，你才不會被問倒",
      "講完之後怎麼收尾，不用整晚反芻",
    ],
    limit: "這處理的是難講但安全的對話。若關係中涉及暴力、控制或讓你感到恐懼，請撥 113 保護專線。",
    emoji: "💬",
    tint: "#F3EDF9",
  },
  {
    id: "AP-SL-07",
    kind: "digital",
    toolKey: "big-decision",
    name: "大決定拆解",
    en: "Big Decision Breakdown",
    price: 850,
    blurb: "該不該離職、搬家、分手——用你在工作上拆問題的方法，拆一次人生。",
    feat: [
      "把「我不知道」拆成幾個可以分別回答的小問題",
      "寫出最壞情況，以及你實際承受得起的範圍",
      "設一個檢查點，不用逼自己今天就決定",
    ],
    limit: "只幫你把問題想清楚，不會替你做決定。涉及資遣費、婚姻財產、稅務請找專業確認。",
    emoji: "🧭",
    tint: "#E7F7F0",
  },
  {
    id: "AP-SL-08",
    kind: "digital",
    toolKey: "purchase-pause",
    name: "這個該不該買",
    en: "Purchase Pause",
    price: 850,
    blurb: "加進購物車之後、按下結帳之前的那三分鐘。",
    feat: [
      "換算成工時：這筆錢等於你上幾小時的班",
      "算每次使用成本，貴的合理、便宜的現形",
      "想買但沒買的記下來，一個月後回看還想要嗎",
    ],
    limit: "只處理單筆消費決定，不提供投資、保險或財務規劃建議。",
    emoji: "🛒",
    tint: "#FFF3E4",
  },
  {
    id: "AP-SL-13",
    kind: "digital",
    toolKey: "commute-decompress",
    name: "下班的緩衝",
    en: "Commute Decompress",
    price: 850,
    chat: true,
    blurb: "回家路上那二十分鐘，把工作留在外面。",
    feat: [
      "三個問題結束今天，不帶回家",
      "明天要煩的寫下來，今晚就不用一直想",
      "每週看一次，哪幾天特別難",
    ],
    limit: "這是日常收尾工具，不是心理治療。情緒持續影響生活時，跟心理師或身心科談會比較有用。",
    emoji: "🌆",
    tint: "#ECF0F7",
  },
  {
    id: "AP-SL-16",
    kind: "digital",
    toolKey: "home-buying",
    name: "買房",
    en: "Home Buying",
    price: 850,
    blurb: "算出真正要準備的現金、做一次壓力測試，再決定要不要看下去。",
    feat: [
      "自備款以外的一次性費用逐項列出，不會簽約才發現",
      "利率升 2% 再算一次，用那個數字做決定",
      "看屋檢查清單與合約關鍵條款，逐條白話",
    ],
    limit: "只做負擔能力試算與資訊整理。不預測房價、不評估增值、不構成投資或法律建議。",
    emoji: "🏠",
    tint: "#F6EFE6",
  },
  {
    id: "AP-SL-19",
    kind: "digital",
    toolKey: "gift-etiquette",
    name: "送禮與人情",
    en: "Gift & Etiquette",
    price: 850,
    blurb: "紅包包多少、伴手禮送什麼，不用每次都問人。",
    feat: [
      "依場合、關係、地區抓一個合理金額區間，不是瞎猜",
      "伴手禮或禮物選項，附上為什麼適合這個場合",
      "禮金封面、卡片怎麼寫，附上可以直接用的句子",
    ],
    limit: "只給一般行情參考，不是特定家庭或地方習俗的正式規範。喪事、大型婚宴這類重要場合，建議還是跟長輩或當地習俗再確認一次。",
    emoji: "🎁",
    tint: "#FBEAF0",
  },
  {
    id: "AP-SL-20",
    kind: "digital",
    toolKey: "style-planning",
    name: "個人風格規劃",
    en: "Personal Style Planning",
    price: 850,
    blurb: "從你已經有的衣服開始排穿搭，不是叫你買更多。",
    feat: [
      "從你現有的單品排出新搭法，不主打購物清單",
      "抓出你衣櫃裡真正的風格主軸，不是套用網路流行公式",
      "不同場合的穿搭建議，附上為什麼這樣搭",
    ],
    limit: "只根據你描述的衣物給搭配建議，不做身形或外貌評論，也不是專業造型師的到府服務。",
    emoji: "🎀",
    tint: "#FFEDE6",
  },
  {
    id: "AP-SL-21",
    kind: "digital",
    toolKey: "startup-basics",
    name: "人生商學院",
    en: "Startup Basics",
    price: 850,
    blurb: "從零到第一個客戶，創業最初的路怎麼走。",
    feat: [
      "商業模式一頁講清楚：你賣什麼、賣給誰、怎麼賺",
      "定價邏輯拆解，不是憑感覺喊價",
      "找到並談成第一個客戶的具體步驟",
    ],
    limit: "只做創業初期的思路整理，不是財務顧問、律師或會計師。公司登記、稅務、合約審閱請找專業處理。",
    emoji: "💼",
    tint: "#E6F1FB",
  },
  {
    id: "AP-SL-22",
    kind: "digital",
    toolKey: "viral-video-script",
    name: "自媒體爆款短片生成器",
    en: "Viral Short-Video Script",
    price: 850,
    blurb: "抓住前三秒的鉤子，短影音腳本骨架不用等靈感。",
    feat: [
      "前三秒鉤子給三種寫法，附上為什麼這樣開頭留得住人",
      "整支影片的節奏拆解，幾秒講什麼、什麼時候該丟一個轉折",
      "標題與文案建議，附上為什麼這樣下比較容易被點開",
    ],
    limit: "只給腳本結構跟開頭鉤子的建議，不保證真的會爆紅——會不會紅還牽涉到平台當下的演算法、你的帳號歷史表現、發布時機，這些是任何工具都沒辦法保證的。",
    emoji: "🎬",
    tint: "#F3E9FB",
    /** 訂閱方案：付這個價格換這顆工具在訂閱期間不限次數，不佔用共用的 300 次判讀池 */
    subscription: {
      price: 300,
      periodLabel: "月",
      pitch: "常態拍片的人訂閱比較划算，不限次數，不用擔心共用池被這一顆吃光。",
    },
    /** 專屬頁面用的深度介紹，一般商品卡片不會用到這些 */
    detail: {
      hook: "空白的腳本頁比空白的行事曆更讓人焦慮。",
      story: "你知道要拍什麼，但打開剪輯軟體那一刻腦袋一片空白——這顆工具不是幫你想「拍什麼」，是幫你把已經有的主題，變成一份可以直接照著唸的腳本。",
      sections: [
        {
          title: "為什麼前三秒決定一切",
          body: "短影音平台的演算法看的是「完播率」跟「留存曲線」，觀眾在前三秒就決定要不要往下滑。這顆工具會依你的主題，給三種不同心理機制的鉤子寫法——認知落差、先爆點後解釋、懸念提問——讓你不用每次都憑感覺賭一個開頭。",
        },
        {
          title: "節奏比創意更重要",
          body: "很多人失敗不是內容不好，是節奏亂掉：該收尾的時候還在鋪陳，該進主題的時候還在暖場。這顆工具把 30 秒拆成四個節拍，每個節拍該講什麼、佔多少秒都寫清楚，你只要照著填內容。",
        },
        {
          title: "標題文案不再靠猜",
          body: "同樣的影片，換一個標題點閱率可能差好幾倍。每次判讀都附上為什麼這樣下標比較容易被點開，讓你漸漸抓到自己這個主題適合的下標邏輯，不是每次都重新摸索。",
        },
      ],
      forWho: ["已經有內容主軸、卡在不知道怎麼開場的創作者", "發文頻率高、需要穩定產出腳本骨架的自媒體經營者", "不想再花時間研究「爆款公式」，想要一個可以直接套用的結構"],
    },
  },
];

/** Wave 1 的七顆，套裝價鎖定這七顆——之後上新商品不會連帶把套裝條件跟著改掉 */
export const WAVE_1_IDS = ["AP-SL-01", "AP-SL-09", "AP-SL-06", "AP-SL-07", "AP-SL-08", "AP-SL-13", "AP-SL-16"];

/** 七顆全帶的套裝價 */
export const SKILL_BUNDLE = {
  id: "AP-KIT-L7",
  kind: "digital",
  name: "七顆全帶",
  price: 4900,
  skillIds: WAVE_1_IDS,
};

/** 還在做的，只收通知名單 */
export const COMING_SOON = [
  ["看醫生前的準備", "門診三分鐘，先整理好要講的話", "🩺"],
  ["療癒陪伴", "情緒上來的時候，有個地方把話講完", "🌙"],
  ["家的空間重置", "小坪數、租來的房子也能住得像自己的", "🪴"],
  ["租屋與搬家", "押金怎麼拿得回來", "🔑"],
];

/**
 * 能量小物在這裡的是「種子資料」，第一次啟動時會拿來當預設值。
 * 實際上架、改價、下架，之後都在 /admin 後台做，不會回來改這個檔案。
 * 真正的商品清單（含後台新增的）在 src/lib/products.js。
 */
export const SHIPPING_FEE = 80;
export const FREE_SHIPPING_OVER = 2000;
